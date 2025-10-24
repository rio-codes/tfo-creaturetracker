import 'server-only';

import { db } from '@/src/db';
import { researchGoals, breedingPairs, breedingLogEntries, creatures } from '@/src/db/schema';
import type {
    EnrichedResearchGoal,
    Prediction,
    EnrichedBreedingPair,
    EnrichedCreature,
} from '@/types';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/serialization';
import { calculateGeneProbability } from '@/lib/genetics';
import { eq, or, and, inArray } from 'drizzle-orm';

export async function getGoalById(id: string): Promise<EnrichedResearchGoal | null> {
    try {
        const goalData = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, id),
        });

        console.log(goalData);

        if (!goalData) {
            return null;
        }

        const enrichedGoal = enrichAndSerializeGoal(goalData, goalData.goalMode);

        const finalGoal = {
            ...enrichedGoal,
            user: (goalData as any).user ? { username: (goalData as any).user.username } : null,
        };

        return finalGoal as EnrichedResearchGoal;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getPredictionsForGoal(goalId: string): Promise<Prediction[]> {
    try {
        const goal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, goalId),
        });

        if (!goal || !goal.userId || !goal.assignedPairIds || goal.assignedPairIds.length === 0) {
            return [];
        }

        const goalMode = goal.goalMode;
        const enrichedGoal = enrichAndSerializeGoal(goal, goalMode);

        const assignedPairs = await db.query.breedingPairs.findMany({
            where: and(
                eq(breedingPairs.userId, goal.userId),
                inArray(breedingPairs.id, goal.assignedPairIds!),
                eq(breedingPairs.isArchived, false)
            ),
            with: { maleParent: true, femaleParent: true },
        });

        const predictions = assignedPairs
            .filter((p) => p.maleParent && p.femaleParent)
            .map((pair) => {
                const enrichedMaleParent = enrichAndSerializeCreature(pair.maleParent!);
                const enrichedFemaleParent = enrichAndSerializeCreature(pair.femaleParent!);
                let totalChance = 0;
                let geneCount = 0;
                const chancesByCategory: { [key: string]: number } = {};

                for (const [category, targetGeneInfo] of Object.entries(enrichedGoal!.genes)) {
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

                const averageChance = geneCount > 0 ? totalChance / geneCount : 1;
                const isPossible = Object.entries(chancesByCategory).every(([category, chance]) => {
                    const targetGene = enrichedGoal!.genes[category] as any;
                    return targetGene.isOptional || chance > 0;
                });

                return {
                    pairId: pair.id,
                    pairName: pair.pairName,
                    maleParent: enrichedMaleParent,
                    femaleParent: enrichedFemaleParent,
                    chancesByCategory,
                    averageChance,
                    isPossible,
                    goalId: goal.id,
                    goalName: goal.name,
                };
            });

        return predictions;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getAssignedPairsForGoal(goalId: string): Promise<EnrichedBreedingPair[]> {
    try {
        const goal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, goalId),
            columns: { userId: true, assignedPairIds: true },
        });

        if (!goal || !goal.userId || !goal.assignedPairIds || goal.assignedPairIds.length === 0) {
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

        // 2. Fetch all log entries for these specific pairs
        const logEntries = await db.query.breedingLogEntries.findMany({
            where: and(
                eq(breedingLogEntries.userId, userId),
                inArray(
                    breedingLogEntries.pairId,
                    pairs.map((p) => p.id)
                )
            ),
        });

        // 3. Get all unique progeny composite keys from the logs
        const allProgenyKeys = new Set<string>(); // Stores "userId-code"
        logEntries.forEach((log) => {
            if (log.progeny1UserId && log.progeny1Code) {
                allProgenyKeys.add(`${log.progeny1UserId}-${log.progeny1Code}`);
            }
            if (log.progeny2UserId && log.progeny2Code) {
                allProgenyKeys.add(`${log.progeny2UserId}-${log.progeny2Code}`);
            }
        });

        if (allProgenyKeys.size === 0) {
            // If there are no progeny, return the pairs with an empty progeny array
            return pairs.map((p) => ({
                ...p,
                progeny: [],
            })) as unknown as EnrichedBreedingPair[];
        }

        // 4. Fetch and enrich all progeny creatures using the composite keys
        const progenyKeysArray = Array.from(allProgenyKeys).map((key) => {
            const [userId, code] = key.split('-');
            return { userId, code };
        });

        const progenyCreatures = await db.query.creatures.findMany({
            where: or(
                ...progenyKeysArray.map((key) =>
                    and(eq(creatures.userId, key.userId), eq(creatures.code, key.code))
                )
            ),
        });
        const enrichedProgeny = progenyCreatures.map(enrichAndSerializeCreature);
        const enrichedProgenyMap = new Map(
            enrichedProgeny.map((p) => [`${p?.userId}-${p?.code}`, p])
        );

        // 5. Attach progeny to each pair
        return pairs.map((pair) => {
            const progenyForPair: EnrichedCreature[] = [];
            const logsForThisPair = logEntries.filter((log) => log.pairId === pair.id);

            logsForThisPair.forEach((log) => {
                if (log.progeny1UserId && log.progeny1Code) {
                    const progeny = enrichedProgenyMap.get(
                        `${log.progeny1UserId}-${log.progeny1Code}`
                    );
                    if (progeny) progenyForPair.push(progeny);
                }
                if (log.progeny2UserId && log.progeny2Code) {
                    const progeny = enrichedProgenyMap.get(
                        `${log.progeny2UserId}-${log.progeny2Code}`
                    );
                    if (progeny) progenyForPair.push(progeny);
                }
            });

            return {
                ...pair,
                progeny: progenyForPair,
            } as unknown as EnrichedBreedingPair;
        });
    } catch (error) {
        console.error(error);
        return [];
    }
}
