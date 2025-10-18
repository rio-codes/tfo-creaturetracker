import 'server-only';

import type {
    DbCreature,
    DbResearchGoal,
    DbBreedingPair,
    EnrichedBreedingPair,
    EnrichedCreature,
} from '@/types';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/client-serialization';
import { db } from '@/src/db';
import { and, eq, inArray, or } from 'drizzle-orm';
import { breedingLogEntries, achievedGoals, breedingPairs, creatures } from '@/src/db/schema';
import { checkForInbreeding } from './breeding-rules';
import { calculateGeneProbability } from './genetics';

export { enrichAndSerializeCreature, enrichAndSerializeGoal };

export const enrichAndSerializeCreatureWithProgeny = async (
    creatureId: string,
    maxDepth = 1, // Controls how many levels of progeny to fetch
    currentDepth = 0
): Promise<EnrichedCreature> => {
    if (currentDepth >= maxDepth) {
        // At max depth, fetch the creature but no more progeny
        const creatureData = await db.query.creatures.findFirst({
            where: eq(creatures.id, creatureId),
        });
        if (!creatureData) return null;
        const simpleEnrichedCreature = enrichAndSerializeCreature(creatureData);
        if (simpleEnrichedCreature) {
            simpleEnrichedCreature.progeny = []; // Ensure progeny is an empty array
        }
        return simpleEnrichedCreature;
    }

    // Find pairs where this creature is a parent
    const parentPairs = await db.query.breedingPairs.findMany({
        where: or(
            eq(breedingPairs.maleParentId, creatureId),
            eq(breedingPairs.femaleParentId, creatureId)
        ),
        columns: { id: true },
    });

    if (parentPairs.length === 0) {
        // If not a parent, fetch and return the creature with no progeny
        const creatureData = await db.query.creatures.findFirst({
            where: eq(creatures.id, creatureId),
        });
        if (!creatureData) return null;
        const simpleEnrichedCreature = enrichAndSerializeCreature(creatureData);
        if (simpleEnrichedCreature) {
            simpleEnrichedCreature.progeny = [];
        }
        return simpleEnrichedCreature;
    }

    // Find all log entries for the pairs where this creature is a parent
    const pairIds = parentPairs.map((p) => p.id);
    const logs = await db.query.breedingLogEntries.findMany({
        where: inArray(breedingLogEntries.pairId, pairIds),
    });

    const progenyIds = new Set<string>();
    logs.forEach((log) => {
        if (log.progeny1Id) progenyIds.add(log.progeny1Id);
        if (log.progeny2Id) progenyIds.add(log.progeny2Id);
    });

    // Recursively fetch and enrich the progeny
    const progenyPromises = Array.from(progenyIds).map((id) =>
        enrichAndSerializeCreatureWithProgeny(id, maxDepth, currentDepth + 1)
    );
    const progeny = (await Promise.all(progenyPromises)).filter(
        (p): p is NonNullable<EnrichedCreature> => p !== null
    );

    // Fetch the base creature itself
    const creatureData = await db.query.creatures.findFirst({
        where: eq(creatures.id, creatureId),
    });
    if (!creatureData) return null;

    const enrichedBaseCreature = enrichAndSerializeCreature(creatureData);
    if (enrichedBaseCreature) {
        enrichedBaseCreature.progeny = progeny;
    }

    return enrichedBaseCreature;
};

export const enrichAndSerializeBreedingPair = async (
    pair: DbBreedingPair & {
        maleParent: DbCreature | null;
        femaleParent: DbCreature | null;
        progeny?: (DbCreature | null)[];
        assignedGoals?: { goal: DbResearchGoal }[];
    },
    userId: string
): Promise<EnrichedBreedingPair | null> => {
    if (!pair.maleParent || !pair.femaleParent) {
        return null;
    }

    const [relevantLogs, allUserLogs, allRawPairs] = await Promise.all([
        db.query.breedingLogEntries.findMany({
            where: and(
                eq(breedingLogEntries.userId, userId),
                eq(breedingLogEntries.pairId, pair.id)
            ),
        }),
        db.query.breedingLogEntries.findMany({
            where: eq(breedingLogEntries.userId, userId),
        }),
        db.query.breedingPairs.findMany({
            where: eq(breedingPairs.userId, userId),
        }),
    ]);

    const progenyIds = new Set<string>();
    relevantLogs.forEach((log) => {
        if (log.progeny1Id) progenyIds.add(log.progeny1Id);
        if (log.progeny2Id) progenyIds.add(log.progeny2Id);
    });

    const progenyCreatures =
        progenyIds.size > 0
            ? await db.query.creatures.findMany({
                  where: inArray(creatures.id, Array.from(progenyIds)),
              })
            : [];
    const progeny = progenyCreatures.map(enrichAndSerializeCreature);

    const assignedGoalsFromPair = pair.assignedGoals?.map((ag) => ag.goal) || [];
    const achievedGoalIdsForPair =
        progenyIds.size > 0
            ? new Set(
                  (
                      await db.query.achievedGoals.findMany({
                          where: and(
                              eq(achievedGoals.userId, userId),
                              inArray(achievedGoals.matchingProgenyId, Array.from(progenyIds))
                          ),
                          columns: { goalId: true },
                      })
                  ).map((ag) => ag.goalId)
              )
            : new Set();

    const assignedGoals = assignedGoalsFromPair.map((goal) => {
        const enrichedGoal = enrichAndSerializeGoal(goal, goal.goalMode);
        const isAchieved = achievedGoalIdsForPair.has(goal.id);

        let totalChance = 0;
        let geneCount = 0;
        let isPossible = true;

        for (const [category, targetGeneInfo] of Object.entries(enrichedGoal.genes)) {
            const targetGene = targetGeneInfo as any;
            const chance = calculateGeneProbability(
                enrichAndSerializeCreature(pair.maleParent),
                enrichAndSerializeCreature(pair.femaleParent),
                category,
                targetGene,
                enrichedGoal.goalMode
            );
            if (!targetGene.isOptional) {
                if (chance === 0) isPossible = false;
                totalChance += chance;
                geneCount++;
            }
        }
        const averageChance = geneCount > 0 ? totalChance / geneCount : 1;

        return { ...enrichedGoal, isAchieved, isPossible, averageChance };
    });

    const isInbred = checkForInbreeding(
        pair.maleParentId,
        pair.femaleParentId,
        allUserLogs,
        allRawPairs
    );

    return {
        ...pair,
        timesBred: relevantLogs.length,
        progenyCount: progeny.length,
        progeny,
        logs: relevantLogs.map((log) => ({
            ...log,
            createdAt: log.createdAt.toISOString(),
            updatedAt: log.createdAt.toISOString(),
        })),
        isInbred,
        createdAt: pair.createdAt.toISOString(),
        updatedAt: pair.updatedAt.toISOString(),
        maleParent: enrichAndSerializeCreature(pair.maleParent),
        femaleParent: enrichAndSerializeCreature(pair.femaleParent),
        assignedGoals: assignedGoals,
    };
};
