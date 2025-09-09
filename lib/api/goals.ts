import 'server-only';

import { db } from '@/src/db';
import {
    researchGoals,
    breedingPairs,
    breedingLogEntries,
    creatures,
} from '@/src/db/schema';
import type {
    EnrichedResearchGoal,
    Prediction,
    EnrichedBreedingPair,
} from '@/types';
import {
    enrichAndSerializeCreature,
    enrichAndSerializeGoal,
} from '@/lib/serialization';
import { calculateGeneProbability } from '@/lib/genetics';
import * as Sentry from '@sentry/nextjs';
import { eq, and, inArray } from 'drizzle-orm';

export async function getGoalById(
    id: string
): Promise<EnrichedResearchGoal | null> {
    try {
        const goalData = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, id),
        });

        console.log(goalData);

        if (!goalData) {
            return null;
        }

        const enrichedGoal = enrichAndSerializeGoal(
            goalData,
            goalData.goalMode
        );

        const finalGoal = {
            ...enrichedGoal,
            user: goalData.user ? { username: goalData.user.username } : null,
        };

        return finalGoal as EnrichedResearchGoal;
    } catch (error) {
        Sentry.captureException(error, {
            extra: { context: `Failed to fetch public goal by ID ${id}` },
        });
        return null;
    }
}

export async function getPredictionsForGoal(
    goalId: string
): Promise<Prediction[]> {
    try {
        const goal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, goalId),
        });

        if (
            !goal ||
            !goal.userId ||
            !goal.assignedPairIds ||
            goal.assignedPairIds.length === 0
        ) {
            return [];
        }

        const goalMode = goal.goalMode;
        const enrichedGoal = enrichAndSerializeGoal(goal, goalMode);

        const assignedPairs = await db.query.breedingPairs.findMany({
            where: and(
                eq(breedingPairs.userId, goal.userId),
                inArray(breedingPairs.id, goal.assignedPairIds!)
            ),
            with: { maleParent: true, femaleParent: true },
        });

        const predictions = assignedPairs
            .filter((p) => p.maleParent && p.femaleParent)
            .map((pair) => {
                const enrichedMaleParent = enrichAndSerializeCreature(
                    pair.maleParent!
                );
                const enrichedFemaleParent = enrichAndSerializeCreature(
                    pair.femaleParent!
                );
                let totalChance = 0;
                let geneCount = 0;
                const chancesByCategory: { [key: string]: number } = {};

                for (const [category, targetGeneInfo] of Object.entries(
                    enrichedGoal!.genes
                )) {
                    const targetGene = targetGeneInfo as any;
                    const chance = calculateGeneProbability(
                        enrichedMaleParent,
                        enrichedFemaleParent,
                        category,
                        targetGene,
                        goalMode
                    );
                    chancesByCategory[category] = chance;

                    if (!targetGene.isOptional) {
                        totalChance += chance;
                        geneCount++;
                    }
                }

                const averageChance =
                    geneCount > 0 ? totalChance / geneCount : 1;
                const isPossible = Object.entries(chancesByCategory).every(
                    ([category, chance]) => {
                        const targetGene = enrichedGoal!.genes[category] as any;
                        return targetGene.isOptional || chance > 0;
                    }
                );

                return {
                    pairId: pair.id,
                    pairName: pair.pairName,
                    maleParent: enrichedMaleParent,
                    femaleParent: enrichedFemaleParent,
                    chancesByCategory,
                    averageChance,
                    isPossible,
                };
            });

        return predictions;
    } catch (error) {
        Sentry.captureException(error, {
            extra: {
                context: `Failed to fetch public predictions for goal ${goalId}`,
            },
        });
        return [];
    }
}

export async function getAssignedPairsForGoal(
    goalId: string
): Promise<EnrichedBreedingPair[]> {
    try {
        const goal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, goalId),
            columns: { userId: true, assignedPairIds: true },
        });

        if (
            !goal ||
            !goal.userId ||
            !goal.assignedPairIds ||
            goal.assignedPairIds.length === 0
        ) {
            return [];
        }

        const userId = goal.userId;
        const assignedPairIds = goal.assignedPairIds;

        // 1. Fetch the assigned pairs
        const pairs = await db.query.breedingPairs.findMany({
            where: and(
                eq(breedingPairs.userId, userId),
                inArray(breedingPairs.id, assignedPairIds)
            ),
        });

        // 2. Fetch all log entries for the user to find progeny
        const logEntries = await db.query.breedingLogEntries.findMany({
            where: and(
                eq(breedingLogEntries.userId, userId),
                inArray(
                    breedingLogEntries.pairId,
                    pairs.map((p) => p.id)
                )
            ),
        });

        // 3. Get all progeny IDs from the logs
        const allProgenyIds = new Set<string>();
        logEntries.forEach((log) => {
            if (log.progeny1Id) allProgenyIds.add(log.progeny1Id);
            if (log.progeny2Id) allProgenyIds.add(log.progeny2Id);
        });

        if (allProgenyIds.size === 0) {
            return pairs.map((p) => ({
                ...p,
                progeny: [],
            })) as EnrichedBreedingPair[];
        }

        // 4. Fetch and enrich all progeny creatures
        const progenyCreatures = await db.query.creatures.findMany({
            where: inArray(creatures.id, Array.from(allProgenyIds)),
        });
        const enrichedProgeny = progenyCreatures.map(
            enrichAndSerializeCreature
        );

        // 5. Attach progeny to each pair
        return pairs.map((pair) => {
            const progenyForPair = enrichedProgeny.filter((p) =>
                logEntries.some(
                    (log) =>
                        log.pairId === pair.id &&
                        (log.progeny1Id === p.id || log.progeny2Id === p.id)
                )
            );
            return { ...pair, progeny: progenyForPair } as EnrichedBreedingPair;
        });
    } catch (error) {
        Sentry.captureException(error, {
            extra: {
                context: `Failed to fetch public assigned pairs for goal ${goalId}`,
            },
        });
        return [];
    }
}
