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
import { and, eq, or } from 'drizzle-orm';
import { breedingLogEntries, achievedGoals, breedingPairs, creatures } from '@/src/db/schema';
import { checkForInbreeding } from './breeding-rules';
import { calculateGeneProbability } from './genetics';

export { enrichAndSerializeCreature, enrichAndSerializeGoal };

export const enrichAndSerializeCreatureWithProgeny = async (
    creatureCode: string,
    userId: string,
    maxDepth = 1, // Controls how many levels of progeny to fetch
    currentDepth = 0
): Promise<EnrichedCreature> => {
    const creatureData = await db.query.creatures.findFirst({
        where: and(eq(creatures.code, creatureCode), eq(creatures.userId, userId)),
    });

    if (!creatureData) return null;

    if (currentDepth >= maxDepth) {
        // At max depth, fetch the creature but no more progeny
        const simpleEnrichedCreature = enrichAndSerializeCreature(creatureData);
        if (simpleEnrichedCreature) {
            simpleEnrichedCreature.progeny = []; // Ensure progeny is an empty array
        }
        return simpleEnrichedCreature;
    }

    // Find pairs where this creature is a parent
    const parentPairs = await db.query.breedingPairs.findMany({
        where: and(
            eq(breedingPairs.userId, userId),
            or(
                and(
                    eq(breedingPairs.maleParentUserId, userId),
                    eq(breedingPairs.maleParentCode, creatureCode)
                ),
                and(
                    eq(breedingPairs.femaleParentUserId, userId),
                    eq(breedingPairs.femaleParentCode, creatureCode)
                )
            )
        ),
        columns: { id: true },
    });

    if (parentPairs.length === 0) {
        // If not a parent, fetch and return the creature with no progeny
        const simpleEnrichedCreature = enrichAndSerializeCreature(creatureData);
        if (simpleEnrichedCreature) {
            simpleEnrichedCreature.progeny = [];
        }
        return simpleEnrichedCreature;
    }

    // Find all log entries for the pairs where this creature is a parent
    const logs = await db.query.breedingLogEntries.findMany({
        where: and(
            eq(breedingLogEntries.userId, userId),
            eq(breedingLogEntries.pairId, parentPairs[0].id)
        ),
    });

    const progenyKeys = new Set<{ userId: string; code: string }>();
    logs.forEach((log) => {
        if (log.progeny1UserId && log.progeny1Code) {
            progenyKeys.add({ userId: log.progeny1UserId, code: log.progeny1Code });
        }
        if (log.progeny2UserId && log.progeny2Code) {
            progenyKeys.add({ userId: log.progeny2UserId, code: log.progeny2Code });
        }
    });

    // Recursively fetch and enrich the progeny
    const progenyPromises = Array.from(progenyKeys).map((key) =>
        enrichAndSerializeCreatureWithProgeny(key.code, key.userId, maxDepth, currentDepth + 1)
    );
    const progeny = (await Promise.all(progenyPromises)).filter(
        (p): p is NonNullable<EnrichedCreature> => p !== null
    );

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

    const relevantLogs = await db.query.breedingLogEntries.findMany({
        where: and(eq(breedingLogEntries.userId, userId), eq(breedingLogEntries.pairId, pair.id)),
    });

    const progenyKeys = new Set<{ userId: string; code: string }>();
    relevantLogs.forEach((log) => {
        if (log.progeny1UserId && log.progeny1Code)
            progenyKeys.add({ userId: log.progeny1UserId, code: log.progeny1Code });
        if (log.progeny2UserId && log.progeny2Code)
            progenyKeys.add({ userId: log.progeny2UserId, code: log.progeny2Code });
    });

    const progenyQueryConditions = Array.from(progenyKeys).map((key) =>
        and(eq(creatures.userId, key.userId), eq(creatures.code, key.code))
    );

    const progenyCreatures =
        progenyQueryConditions.length > 0
            ? await db.query.creatures.findMany({
                  where: or(...progenyQueryConditions),
              })
            : [];
    const progeny = progenyCreatures.map(enrichAndSerializeCreature);

    const assignedGoalsFromPair = pair.assignedGoals?.map((ag) => ag.goal) || [];

    const progenyCompositeKeys = Array.from(progenyKeys);
    const achievedGoalIdsForPair =
        progenyCompositeKeys.length > 0
            ? new Set(
                  (
                      await db.query.achievedGoals.findMany({
                          where: or(
                              ...progenyCompositeKeys.map((key) =>
                                  and(
                                      eq(achievedGoals.matchingProgenyUserId, key.userId),
                                      eq(achievedGoals.matchingProgenyCode, key.code)
                                  )
                              )
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

    const isInbred = await checkForInbreeding(
        { userId: pair.maleParentUserId, code: pair.maleParentCode },
        { userId: pair.femaleParentUserId, code: pair.femaleParentCode }
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
