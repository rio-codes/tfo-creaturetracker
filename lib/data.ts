import "server-only";
import { db } from "@/src/db";
import {
    users,
    creatures,
    researchGoals,
    breedingPairs,
} from "@/src/db/schema";
import { auth } from "@/auth";
import { and, ilike, or, eq, desc, count } from "drizzle-orm";
import type { Creature, ResearchGoal } from "@/types";
import { calculateGeneProbability } from "./genetics";
import { structuredGeneData } from "@/lib/creature-data";

export async function getCreaturesForUser(
    currentPage: number,
    query?: string,
    gender?: string,
    stage?: string,
    species?: string
) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("User is not authenticated.");
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const itemsPerPage = user?.collectionItemsPerPage || 12; // Use setting or fallback
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
        // Get the creatures for the current page
        const paginatedCreatures = await db
            .select()
            .from(creatures)
            .where(and(...conditions))
            .orderBy(desc(creatures.isPinned), desc(creatures.createdAt))
            .limit(itemsPerPage)
            .offset(offset);

        // Get the total count of creatures for this user
        const totalCountResult = await db
            .select({ count: count() })
            .from(creatures)
            .where(and(...conditions));

        const totalCreatures = totalCountResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalCreatures / itemsPerPage);

        return {
            creatures: paginatedCreatures as Creature[],
            totalPages: totalPages,
        };
    } catch (error) {
        console.error("Database Error: Failed to fetch creatures.", error);
        return {
            creatures: [],
            totalPages: 0,
        };
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
        const [user, paginatedGoals] = await Promise.all([
            db.query.users.findFirst({ where: eq(users.id, userId) }),
            db
                .select()
                .from(researchGoals)
                .where(and(...conditions))
                .orderBy(
                    desc(researchGoals.isPinned),
                    desc(researchGoals.createdAt)
                )
                .limit(goalsPerPage)
                .offset(offset),
        ]);

        if (!user) throw new Error("User not found.");

        const goalMode = user.goalMode;

        // Query for enriched goals
        const enrichedGoals = paginatedGoals.map((goal) => {
            const enrichedGenes: { [key: string]: any } = {};
            const speciesGeneData = structuredGeneData[goal.species];

            if (!speciesGeneData || !goal.genes) {
                return { ...goal, genes: {} }; // Safety check
            }

            for (const [category, selection] of Object.entries(goal.genes)) {
                let finalGenotype: string;
                let finalPhenotype: string;

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
                } else {
                    continue;
                }

                let isMulti = false;
                // Only calculate `isMultiGenotype` if the user is in phenotype mode
                if (goalMode === "phenotype") {
                    const categoryData = speciesGeneData[category];
                    const genotypesForPhenotype = categoryData?.filter(
                        (g) => g.phenotype === finalPhenotype
                    );
                    isMulti = (genotypesForPhenotype?.length || 0) > 1;
                }

                // Build the final, consistent object for the card
                enrichedGenes[category] = {
                    genotype: finalGenotype,
                    phenotype: finalPhenotype,
                    isMultiGenotype: isMulti,
                };
            }
            return { ...goal, genes: enrichedGenes };
        });

        const totalCountResult = await db
            .select({ count: count() })
            .from(researchGoals)
            .where(and(...conditions));
        const totalGoals = totalCountResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalGoals / goalsPerPage);

        return {
            goals: enrichedGoals as ResearchGoal[],
            totalPages: totalPages,
        };
    } catch (error) {
        console.error("Database Error: Failed to fetch research goals.", error);
        return { goals: [], totalPages: 0 };
    }
}

export async function fetchBreedingPairs(currentPage: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not authenticated.");

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const pairsPerPage = user?.pairsItemsPerPage || 12; // Use setting or fallback
    const offset = (currentPage - 1) * pairsPerPage;

    try {
        const paginatedPairs = await db.query.breedingPairs.findMany({
            where: eq(breedingPairs.userId, userId),
            with: {
                maleParent: true,
                femaleParent: true,
            },
            orderBy: [
                desc(breedingPairs.isPinned),
                desc(breedingPairs.createdAt),
            ],
            limit: pairsPerPage,
            offset: offset,
        });

        const allGoals = await db.query.researchGoals.findMany({
            where: eq(researchGoals.userId, userId),
        });

        const pairsWithGoals = paginatedPairs.map((pair) => {
            const assignedGoals = allGoals.filter((goal) =>
                pair.assignedGoalIds?.includes(goal.id)
            );
            return { ...pair, assignedGoals };
        });

        const totalCountResult = await db
            .select({ count: count() })
            .from(breedingPairs)
            .where(eq(breedingPairs.userId, userId));
        const totalPages = Math.ceil(
            (totalCountResult[0]?.count ?? 0) / pairsPerPage
        );

        return { pairs: pairsWithGoals, totalPages };
    } catch (error) {
        console.error("Database Error: Failed to fetch breeding pairs.", error);
        return { pairs: [], totalPages: 0 };
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
        const totalCreatures = totalCountResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalCreatures / itemsPerPage);

        return { creatures: paginatedCreatures as Creature[], totalPages };
    } catch (error) {
        console.error("Database Error: Failed to fetch creatures.", error);
        return { creatures: [], totalPages: 0 };
    }
}
export async function getAllCreaturesForUser(): Promise<Creature[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        return await db.query.creatures.findMany({
            where: eq(creatures.userId, userId),
        });
    } catch (error) {
        console.error("Database Error: Failed to fetch all creatures.", error);
        return [];
    }
}

export async function getAllResearchGoalsForUser(): Promise<ResearchGoal[]> {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return [];
    }

    try {
        const allUserGoals = await db.query.researchGoals.findMany({
            where: eq(researchGoals.userId, userId),
            orderBy: [desc(researchGoals.createdAt)],
        });
        return allUserGoals as ResearchGoal[];
    } catch (error) {
        console.error(
            "Database Error: Failed to fetch all research goals.",
            error
        );
        return [];
    }
}

export async function getAllBreedingPairsForUser() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        return await db.query.breedingPairs.findMany({
            where: eq(breedingPairs.userId, userId),
            with: { maleParent: true, femaleParent: true },
        });
    } catch (error) {
        console.error("Database Error: Failed to fetch all pairs.", error);
        return [];
    }
}

export async function fetchPaginatedBreedingPairs(currentPage: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { pairs: [], totalPages: 0 };

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const pairsPerPage = user?.pairsItemsPerPage || 12; // Use setting or fallback
    const offset = (currentPage - 1) * pairsPerPage;

    try {
        // Get the pairs for the current page
        const paginatedPairs = await db.query.breedingPairs.findMany({
            where: eq(breedingPairs.userId, userId),
            with: {
                maleParent: true,
                femaleParent: true,
            },
            orderBy: [
                desc(breedingPairs.isPinned),
                desc(breedingPairs.createdAt),
            ],
            limit: pairsPerPage,
            offset: offset,
        });

        // Get the total count of pairs to calculate total pages
        const totalCountResult = await db
            .select({ value: count() })
            .from(breedingPairs)
            .where(eq(breedingPairs.userId, userId));

        const totalPairs = totalCountResult[0].value;
        const totalPages = Math.ceil(totalPairs / pairsPerPage);

        return { pairs: paginatedPairs, totalPages };
    } catch (error) {
        console.error("Database Error: Failed to fetch breeding pairs.", error);
        return { pairs: [], totalPages: 0 };
    }
}

export async function fetchGoalDetailsAndPredictions(goalId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not authenticated.");

    try {
        const [user, goal] = await Promise.all([
            db.query.users.findFirst({ where: eq(users.id, userId) }),
            db.query.researchGoals.findFirst({
                where: and(
                    eq(researchGoals.id, goalId),
                    eq(researchGoals.userId, userId)
                ),
            }),
        ]);

        if (!user) throw new Error("User not found.");
        if (!goal) return { goal: null, predictions: [] };

        const goalMode = user.goalMode;

        const enrichedGenes: { [key: string]: any } = {};
        const speciesGeneData = structuredGeneData[goal.species];

        if (speciesGeneData && goal.genes && typeof goal.genes === "object") {
            for (const [category, selection] of Object.entries(goal.genes)) {
                let finalGenotype: string;
                let finalPhenotype: string;

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
                } else {
                    continue;
                }

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
        const enrichedGoal = { ...goal, genes: enrichedGenes };

        const relevantPairs = await db.query.breedingPairs.findMany({
            where: and(
                eq(breedingPairs.userId, userId),
                eq(breedingPairs.species, goal.species)
            ),
            with: { maleParent: true, femaleParent: true },
        });

        const predictions = relevantPairs.map((pair) => {
            let totalChance = 0;
            let geneCount = 0;
            const chancesByCategory: { [key: string]: number } = {};

            for (const [category, targetGene] of Object.entries(
                enrichedGoal.genes
            )) {
                if (category !== "Gender") {
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
            }

            const averageChance = geneCount > 0 ? totalChance / geneCount : 0;
            const isPossible = Object.values(chancesByCategory).every(
                (chance) => chance > 0
            );

            return {
                pairId: pair.id,
                pairName: pair.pairName,
                maleParent: pair.maleParent,
                femaleParent: pair.femaleParent,
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