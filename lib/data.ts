import "server-only";
import { db } from "@/src/db";
import {
    users,
    creatures,
    researchGoals,
    breedingPairs,
    breedingLogEntries,
} from "@/src/db/schema";
import { auth } from "@/auth";
import { and, ilike, or, eq, desc, count } from "drizzle-orm";
import type {
    DbCreature,
    DbResearchGoal,
    DbBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
    EnrichedBreedingPair,
} from "@/types";
import { structuredGeneData } from "@/lib/creature-data";
import { calculateGeneProbability } from "./genetics";

// ============================================================================
// === HELPER FUNCTIONS (ENRICHMENT & SERIALIZATION) ==========================
// ============================================================================

const enrichAndSerializeCreature = (creature: DbCreature): EnrichedCreature => {
    if (!creature) return null;
    const speciesGeneData = structuredGeneData[creature.species || ""];
    return {
        ...creature,
        createdAt: creature.createdAt.toISOString(),
        updatedAt: creature.updatedAt.toISOString(),
        gottenAt: creature.gottenAt ? creature.gottenAt.toISOString() : null,
        geneData:
            creature.genetics
                ?.split(",")
                .map((genePair) => {
                    const [category, genotype] = genePair.split(":");
                    if (!category || !genotype || !speciesGeneData) return null;
                    const categoryData = speciesGeneData[category] as {
                        genotype: string;
                        phenotype: string;
                    }[];
                    const matchedGene = categoryData?.find(
                        (g) => g.genotype === genotype
                    );
                    return {
                        category,
                        genotype,
                        phenotype: matchedGene?.phenotype || "Unknown",
                    };
                })
                .filter(Boolean) || [],
    };
};

const enrichAndSerializeGoal = (
    goal: DbResearchGoal,
    goalMode: "genotype" | "phenotype"
): EnrichedResearchGoal => {
    const enrichedGenes: { [key: string]: any } = {};
    const speciesGeneData = structuredGeneData[goal.species];
    if (speciesGeneData && goal.genes && typeof goal.genes === "object") {
        for (const [category, selection] of Object.entries(goal.genes)) {
            let finalGenotype: string, finalPhenotype: string;
            if (
                typeof selection === "object" &&
                selection.phenotype &&
                selection.genotype
            ) {
                finalGenotype = selection.genotype;
                finalPhenotype = selection.phenotype;
            } else if (typeof selection === "string") {
                finalGenotype = selection;
                const categoryData = speciesGeneData[category] as {
                    genotype: string;
                    phenotype: string;
                }[];
                const matchedGene = categoryData?.find(
                    (g) => g.genotype === finalGenotype
                );
                finalPhenotype = matchedGene?.phenotype || "Unknown";
            } else continue;

            let isMulti = false;
            if (goalMode === "phenotype") {
                const categoryData = speciesGeneData[category];
                const genotypesForPhenotype = categoryData?.filter(
                    (g) => g.phenotype === finalPhenotype
                );
                isMulti = (genotypesForPhenotype?.length || 0) > 1;
            }
            enrichedGenes[category] = {
                genotype: finalGenotype,
                phenotype: finalPhenotype,
                isMultiGenotype: isMulti,
            };
        }
    }
    return {
        ...goal,
        genes: enrichedGenes,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
    };
};

const enrichAndSerializeBreedingPair = (
    pair: DbBreedingPair & { maleParent: DbCreature; femaleParent: DbCreature },
    allEnrichedGoals: EnrichedResearchGoal[],
    allLogEntries: any[]
): EnrichedBreedingPair => {
    const relevantLogs = allLogEntries.filter((log) => log.pairId === pair.id);
    const timesBred = relevantLogs.length;
    const progenyCount = relevantLogs.reduce((acc, log) => {
        if (log.progeny1Id) acc++;
        if (log.progeny2Id) acc++;
        return acc;
    }, 0);

    const assignedGoals = allEnrichedGoals.filter((goal) =>
        pair.assignedGoalIds?.includes(goal!.id)
    );

    return {
        ...pair,
        timesBred,
        progenyCount,
        createdAt: pair.createdAt.toISOString(),
        updatedAt: pair.updatedAt.toISOString(),
        maleParent: enrichAndSerializeCreature(pair.maleParent),
        femaleParent: enrichAndSerializeCreature(pair.femaleParent),
        assignedGoals: assignedGoals,
    };
};

// ============================================================================
// === PUBLIC DATA-FETCHING FUNCTIONS =========================================
// ============================================================================

export async function getAllBreedingPairsForUser(): Promise<
    EnrichedBreedingPair[]
> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) return [];

        const [allPairs, allGoals, logEntries] = await Promise.all([
            db.query.breedingPairs.findMany({
                where: eq(breedingPairs.userId, userId),
                with: { maleParent: true, femaleParent: true },
            }),
            db.query.researchGoals.findMany({
                where: eq(researchGoals.userId, userId),
            }),
            db.query.breedingLogEntries.findMany({
                where: eq(breedingLogEntries.userId, userId),
            }),
        ]);

        const enrichedGoals = allGoals.map((goal) =>
            enrichAndSerializeGoal(goal, user.goalMode)
        );
        const enrichedPairs = allPairs.map((pair) =>
            enrichAndSerializeBreedingPair(pair, enrichedGoals, logEntries)
        );

        return enrichedPairs;
    } catch (error) {
        console.error(
            "Database Error: Failed to fetch all breeding pairs.",
            error
        );
        return [];
    }
}

export async function fetchGoalDetailsAndPredictions(goalId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not authenticated.");

    try {
        const [user, goal, relevantPairs] = await Promise.all([
            db.query.users.findFirst({ where: eq(users.id, userId) }),
            db.query.researchGoals.findFirst({
                where: and(
                    eq(researchGoals.id, goalId),
                    eq(researchGoals.userId, userId)
                ),
            }),
            db.query.breedingPairs.findMany({
                where: eq(breedingPairs.userId, userId),
                with: { maleParent: true, femaleParent: true },
            }),
        ]);

        if (!user) throw new Error("User not found.");
        if (!goal) return { goal: null, predictions: [] };

        const goalMode = user.goalMode;
        const enrichedGoal = enrichAndSerializeGoal(goal, goalMode);

        const predictions = relevantPairs
            .filter((pair) => pair.species === goal.species) // Filter pairs by the goal's species
            .map((pair) => {
                let totalChance = 0;
                let geneCount = 0;
                const chancesByCategory: { [key: string]: number } = {};

                for (const [category, targetGene] of Object.entries(
                    enrichedGoal!.genes
                )) {
                    const chance = calculateGeneProbability(
                        pair.maleParent,
                        pair.femaleParent,
                        category,
                        targetGene as any,
                        goalMode
                    );
                    chancesByCategory[category] = chance;
                    totalChance += chance;
                    geneCount++;
                }

                const averageChance =
                    geneCount > 0 ? totalChance / geneCount : 0;
                const isPossible = Object.values(chancesByCategory).every(
                    (chance) => chance > 0
                );

                return {
                    goalId: enrichedGoal?.id,
                    goalName: enrichedGoal?.name,
                    pairId: pair.id,
                    pairName: pair.pairName,
                    maleParent: enrichAndSerializeCreature(pair.maleParent),
                    femaleParent: enrichAndSerializeCreature(pair.femaleParent),
                    chancesByCategory,
                    averageChance,
                    isPossible,
                };
            });

        return { goal: enrichedGoal, predictions };
    } catch (error) {
        console.error("Database Error: Failed to fetch goal details.", error);
        return { goal: null, predictions: [] };
    }
}


export async function fetchFilteredCreatures(
    currentPage: number,
    query?: string,
    gender?: string,
    stage?: string,
    species?: string
) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("User is not authenticated.");

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const itemsPerPage = user?.collectionItemsPerPage || 12;
    const offset = (currentPage - 1) * itemsPerPage;

    const stageToGrowthLevel: { [key: string]: number } = {
        capsule: 1,
        juvenile: 2,
        adult: 3,
    };
    const growthLevel = stage ? stageToGrowthLevel[stage] : undefined;

    const conditions = [
        eq(creatures.userId, userId),
        query
            ? or(
                    ilike(creatures.code, `%${query}%`),
                    ilike(creatures.creatureName, `%${query}%`)
                )
            : undefined,
        gender && gender !== "all" ? eq(creatures.gender, gender) : undefined,
        growthLevel ? eq(creatures.growthLevel, growthLevel) : undefined,
        species && species !== "all"
            ? ilike(creatures.species, species)
            : undefined,
    ].filter(Boolean);

    try {
        const paginatedCreatures = await db
            .select()
            .from(creatures)
            .where(and(...conditions))
            .orderBy(desc(creatures.isPinned), desc(creatures.createdAt))
            .limit(itemsPerPage)
            .offset(offset);
        const totalCountResult = await db
            .select({ count: count() })
            .from(creatures)
            .where(and(...conditions));
        const totalPages = Math.ceil(
            (totalCountResult[0]?.count ?? 0) / itemsPerPage
        );

        const enrichedCreatures = paginatedCreatures.map(
            enrichAndSerializeCreature
        );

        return { creatures: enrichedCreatures, totalPages };
    } catch (error) {
        console.error("Database Error: Failed to fetch creatures.", error);
        return { creatures: [], totalPages: 0 };
    }
}

export async function fetchFilteredResearchGoals(
    currentPage: number,
    query?: string,
    species?: string
) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("User is not authenticated.");

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const goalsPerPage = user?.goalsItemsPerPage || 12;
    const offset = (currentPage - 1) * goalsPerPage;

    const conditions = [
        eq(researchGoals.userId, userId),
        query ? ilike(researchGoals.name, `%${query}%`) : undefined,
        species && species !== "all"
            ? eq(researchGoals.species, species)
            : undefined,
    ].filter(Boolean);

    try {
        const paginatedGoals = await db
            .select()
            .from(researchGoals)
            .where(and(...conditions))
            .orderBy(
                desc(researchGoals.isPinned),
                desc(researchGoals.createdAt)
            )
            .limit(goalsPerPage)
            .offset(offset);
        const totalCountResult = await db
            .select({ count: count() })
            .from(researchGoals)
            .where(and(...conditions));
        const totalGoals = totalCountResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalGoals / goalsPerPage);

        const enrichedGoals = paginatedGoals.map((goal) =>
            enrichAndSerializeGoal(goal, user!.goalMode)
        );

        return { goals: enrichedGoals, totalPages };
    } catch (error) {
        console.error("Database Error: Failed to fetch research goals.", error);
        return { goals: [], totalPages: 0 };
    }
}

export async function fetchBreedingPairsWithStats(currentPage: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { pairs: [], totalPages: 0 };

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const pairsPerPage = user?.pairsItemsPerPage || 10;
    const offset = (currentPage - 1) * pairsPerPage;

    try {
        const [paginatedPairs, allGoals, logEntries] = await Promise.all([
            db.query.breedingPairs.findMany({
                where: eq(breedingPairs.userId, userId),
                with: { maleParent: true, femaleParent: true },
                orderBy: [
                    desc(breedingPairs.isPinned),
                    desc(breedingPairs.createdAt),
                ],
                limit: pairsPerPage,
                offset: offset,
            }),
            db.query.researchGoals.findMany({
                where: eq(researchGoals.userId, userId),
            }),
            db.query.breedingLogEntries.findMany({
                where: eq(breedingLogEntries.userId, userId),
            }),
        ]);

        if (paginatedPairs.length === 0) {
            return { pairs: [], totalPages: 0 };
        }

        const enrichedGoals = allGoals.map((goal) =>
            enrichAndSerializeGoal(goal, user!.goalMode)
        );
        const enrichedPairs = paginatedPairs.map((pair) =>
            enrichAndSerializeBreedingPair(pair, enrichedGoals, logEntries)
        );

        const totalCountResult = await db
            .select({ value: count() })
            .from(breedingPairs)
            .where(eq(breedingPairs.userId, userId));
        const totalPages = Math.ceil(totalCountResult[0].value / pairsPerPage);

        return { pairs: enrichedPairs, totalPages };
    } catch (error) {
        console.error(
            "Database Error: Failed to fetch breeding pairs with stats.",
            error
        );
        return { pairs: [], totalPages: 0 };
    }
}

// These functions fetch ALL items and are used for populating dropdowns
export async function getAllCreaturesForUser(): Promise<EnrichedCreature[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        const fetchedCreatures = await db.query.creatures.findMany({
            where: eq(creatures.userId, userId),
        });
        return fetchedCreatures.map(enrichAndSerializeCreature);
    } catch (error) {
        console.error("Database Error: Failed to fetch all creatures.", error);
        return [];
    }
}

export async function getAllResearchGoalsForUser(): Promise<
    EnrichedResearchGoal[]
> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        const allUserGoals = await db.query.researchGoals.findMany({
            where: eq(researchGoals.userId, userId),
        });
        return allUserGoals.map((goal) =>
            enrichAndSerializeGoal(goal, user!.goalMode)
        );
    } catch (error) {
        console.error(
            "Database Error: Failed to fetch all research goals.",
            error
        );
        return [];
    }
}
