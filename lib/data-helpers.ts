import type {
    DbCreature,
    DbBreedingLogEntry,
    DbBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
    EnrichedBreedingPair,
} from '@/types';
import * as Sentry from '@sentry/nextjs';
import { checkForInbreeding } from '@/lib/breeding-rules';
import { calculateGeneProbability } from '@/lib/genetics';
import { enrichAndSerializeCreature } from '@/lib/serialization';

export const enrichAndSerializeBreedingPair = (
    pair: DbBreedingPair & {
        maleParent: DbCreature | null;
        femaleParent: DbCreature | null;
    },
    allEnrichedGoals: EnrichedResearchGoal[],
    allLogEntries: DbBreedingLogEntry[],
    allCreatures: EnrichedCreature[],
    allUserAchievedGoals: any[],
    allRawPairs: DbBreedingPair[]
): EnrichedBreedingPair | null => {
    if (!pair.maleParent || !pair.femaleParent) {
        Sentry.logger.warn(
            `Skipping pair ${pair.id} due to missing parent data.`
        );
        return null;
    }

    const relevantLogs = allLogEntries.filter((log) => log.pairId === pair.id);
    const timesBred = relevantLogs.length;

    const progenyIds = new Set<string>();
    relevantLogs.forEach((log) => {
        if (log.progeny1Id) progenyIds.add(log.progeny1Id);
        if (log.progeny2Id) progenyIds.add(log.progeny2Id);
    });

    const progeny = allCreatures.filter((c) => c && progenyIds.has(c.id));
    const serializedLogs = relevantLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
    }));

    const progenyCount = progeny.length;

    const assignedGoalsFromPair = allEnrichedGoals.filter(
        (goal): goal is NonNullable<EnrichedResearchGoal> =>
            goal !== null && (pair.assignedGoalIds?.includes(goal.id) ?? false)
    );

    const achievedGoalIdsForPair = new Set(
        allUserAchievedGoals
            .filter((ag) => progenyIds.has(ag.matchingProgenyId))
            .map((ag) => ag.goalId)
    );

    const assignedGoals = assignedGoalsFromPair.map((goal) => {
        const isAchieved = achievedGoalIdsForPair.has(goal.id);
        let totalChance = 0;
        let geneCount = 0;
        let isPossible = true;
        const goalMode = goal.goalMode;

        for (const [category, targetGeneInfo] of Object.entries(goal.genes)) {
            const targetGene = targetGeneInfo as any;
            const chance = calculateGeneProbability(
                enrichAndSerializeCreature(pair.maleParent!),
                enrichAndSerializeCreature(pair.femaleParent!),
                category,
                targetGene,
                goalMode
            );
            if (!targetGene.isOptional) {
                if (chance === 0) isPossible = false;
                totalChance += chance;
                geneCount++;
            }
        }
        const averageChance = geneCount > 0 ? totalChance / geneCount : 1;

        return { ...goal, isAchieved, isPossible, averageChance };
    });

    const isInbred = checkForInbreeding(
        pair.maleParentId,
        pair.femaleParentId,
        allLogEntries,
        allRawPairs
    );

    return {
        ...pair,
        timesBred,
        progenyCount,
        progeny,
        logs: serializedLogs,
        isInbred,
        createdAt: pair.createdAt.toISOString(),
        updatedAt: pair.updatedAt.toISOString(),
        maleParent: enrichAndSerializeCreature(pair.maleParent),
        femaleParent: enrichAndSerializeCreature(pair.femaleParent),
        assignedGoals: assignedGoals,
    };
};
