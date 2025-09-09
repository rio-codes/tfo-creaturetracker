import 'server-only';

import { db } from '@/src/db';
import { researchGoals, breedingPairs } from '@/src/db/schema';
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
import { fetchBreedingPairsWithStats } from '@/lib/data';
import { eq, and } from 'drizzle-orm';

export async function getGoalById(
    id: string
): Promise<EnrichedResearchGoal | null> {
    try {
        const goalData = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, id),
            with: {
                user: {
                    columns: {
                        username: true,
                    },
                },
            },
        });

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
                inArray(breedingPairs.id, goal.assignedPairIds)
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
    const goal = await db.query.researchGoals.findFirst({
        where: eq(researchGoals.id, goalId),
        columns: { assignedPairIds: true },
    });

    if (!goal || !goal.assignedPairIds || goal.assignedPairIds.length === 0) {
        return [];
    }

    // This is a bit of a hack, but `fetchBreedingPairsWithStats` already has all the complex enrichment logic.
    // We can call it without filters to get all pairs for the user, then filter by the assigned IDs.
    // This is less efficient than a direct query but avoids duplicating the complex enrichment logic.
    const { pairs: allEnrichedPairs } = await fetchBreedingPairsWithStats();

    const assignedIds = new Set(goal.assignedPairIds);
    return allEnrichedPairs.filter((pair) => assignedIds.has(pair.id));
}
