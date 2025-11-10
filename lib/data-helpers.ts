import type {
    DbCreature,
    DbBreedingLogEntry,
    DbBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
    EnrichedBreedingPair,
    GoalGene,
} from '@/types';

import { checkForInbreeding } from '@/lib/breeding-rules';
import { calculateGeneProbability } from '@/lib/genetics';
import { enrichAndSerializeCreature } from '@/lib/serialization';
export const enrichAndSerializeBreedingPair = async (
    pair: DbBreedingPair & {
        maleParent: DbCreature | null;
        femaleParent: DbCreature | null;
    },
    allEnrichedGoals: EnrichedResearchGoal[],
    allLogEntries: DbBreedingLogEntry[],
    allCreatures: EnrichedCreature[],
    allUserAchievedGoals: any[]
): Promise<EnrichedBreedingPair | null> => {
    if (!pair.maleParent || !pair.femaleParent) {
        return null;
    }

    const relevantLogs = allLogEntries.filter((log) => log.pairId === pair.id);
    const timesBred = relevantLogs.length;

    const progenyKeys = new Set<string>(); // "userId-code"
    relevantLogs.forEach((log) => {
        if (log.progeny1UserId && log.progeny1Code)
            progenyKeys.add(`${log.progeny1UserId}-${log.progeny1Code}`);
        if (log.progeny2UserId && log.progeny2Code)
            progenyKeys.add(`${log.progeny2UserId}-${log.progeny2Code}`);
    });

    const progeny = allCreatures.filter((c) => c && progenyKeys.has(`${c.userId}-${c.code}`));
    const serializedLogs = relevantLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(), // Log entries don't have an updatedAt, but SerializedBreedingLogEntry requires it.
        updatedAt: log.createdAt.toISOString(),
    }));

    const progenyCount = progeny.length;

    const assignedGoalsFromPair = allEnrichedGoals.filter(
        (goal): goal is NonNullable<EnrichedResearchGoal> =>
            goal !== null && (pair.assignedGoalIds?.includes(goal.id) ?? false)
    );

    const achievedGoalIdsForPair = new Set(
        allUserAchievedGoals
            .filter((ag) =>
                progeny.some(
                    (p) =>
                        p?.userId === ag.matchingProgenyUserId && p?.code === ag.matchingProgenyCode
                )
            )
            .map((ag) => ag.goalId)
    );

    const assignedGoals = assignedGoalsFromPair.map((goal) => {
        const isAchieved = achievedGoalIdsForPair.has(goal.id);
        let totalChance = 0;
        let geneCount = 0;
        let isPossible = true;
        const enrichedMaleParent = enrichAndSerializeCreature(pair.maleParent);
        const enrichedFemaleParent = enrichAndSerializeCreature(pair.femaleParent);

        for (const [category, targetGeneInfo] of Object.entries(goal.genes)) {
            const targetGene = targetGeneInfo as any;
            const chance = calculateGeneProbability(
                enrichedMaleParent,
                enrichedFemaleParent,
                category,
                targetGeneInfo as GoalGene,
                goal.goalMode
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

    const isInbred = await checkForInbreeding(
        { userId: pair.maleParentUserId, code: pair.maleParentCode },
        { userId: pair.femaleParentUserId, code: pair.femaleParentCode }
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
