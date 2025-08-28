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
import { put as vercelBlobPut } from "@vercel/blob";

// ============================================================================
// === HELPER FUNCTIONS (ENRICHMENT & SERIALIZATION) ==========================
// ============================================================================

// serialize dates and add rich gene data to creature object
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
                .filter(
                    (
                        gene
                    ): gene is {
                        category: string;
                        genotype: string;
                        phenotype: string;
                    } => gene !== null
                ) || [],
    };
};

// serialize dates and add enriched gene data to research goal object
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

// serialize dates, enrich parent creatures, and add breeding log entries to breeding pair object
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

// fetch all enriched breeding pairs for logged-in user
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
            enrichAndSerializeGoal(goal, goal.goalMode)
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

// fetch assigned breeding pairs with enriched parents and genetic predictions for a research goal 
export async function fetchGoalDetailsAndPredictions(goalId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not authenticated.");

    try {
        // fetch and enrich goal
        const goal = await db.query.researchGoals.findFirst({
            where: and(
                eq(researchGoals.id, goalId),
                eq(researchGoals.userId, userId)
            ),
        });

        // if goal does not exist return null and empty predictions array
        if (!goal) return { goal: null, predictions: [] };

        // get goal mode from goal and enrich/serialize goal
        const goalMode = goal.goalMode;
        const enrichedGoal = enrichAndSerializeGoal(goal, goalMode);

        // fetch breeding pairs for goal
        const relevantPairs = await db.query.breedingPairs.findMany({
            where: and(
                eq(breedingPairs.userId, userId),
                eq(breedingPairs.species, goal.species)
            ),
            with: { maleParent: true, femaleParent: true },
        });

        // perform genetic predictions for pairs
        const predictions = relevantPairs.map((pair) => {
            const enrichedMaleParent = enrichAndSerializeCreature(
                pair.maleParent
            );
            const enrichedFemaleParent = enrichAndSerializeCreature(
                pair.femaleParent
            );
            let totalChance = 0;
            let geneCount = 0;
            const chancesByCategory: { [key: string]: number } = {};

            for (const [category, targetGene] of Object.entries(
                enrichedGoal!.genes
            )) {
                if (category === "Gender") {
                    continue;
                }
                const chance = calculateGeneProbability(
                    enrichedMaleParent,
                    enrichedFemaleParent,
                    category,
                    targetGene as any,
                    goalMode
                );
                chancesByCategory[category] = chance;
                totalChance += chance;
                geneCount++;
            }

            const averageChance = geneCount > 0 ? totalChance / geneCount : 0;
            const isPossible = Object.values(chancesByCategory).every(
                (chance) => chance > 0
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

        return { goal: enrichedGoal, predictions };
    } catch (error) {
        console.error("Database Error: Failed to fetch goal details.", error);
        return { goal: null, predictions: [] };
    }
}

// fetch creatures filtered by specified criteria and paginated for UI
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

    // get logged-in user from db, determine setting for creatures per page and offset
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const itemsPerPage = user?.collectionItemsPerPage || 12;
    const offset = (currentPage - 1) * itemsPerPage;

    // filter by growth level if specified
    const stageToGrowthLevel: { [key: string]: number } = {
        capsule: 1,
        juvenile: 2,
        adult: 3,
    };
    const growthLevel = stage ? stageToGrowthLevel[stage] : undefined;

    // filter by search query, gender, growth level, or species if specified
    const conditions = [
        eq(creatures.userId, userId),
        query
            ? or(
                    ilike(creatures.code, `%${query}%`),
                    ilike(creatures.creatureName, `%${query}%`)
                )
            : undefined,
        gender && gender !== "all" ? eq(creatures.gender, gender as any) : undefined,
        growthLevel ? eq(creatures.growthLevel, growthLevel) : undefined,
        species && species !== "all"
            ? ilike(creatures.species, species)
            : undefined,
    ].filter(Boolean);

    try {
        // fetch filtered and paginated creatures for current page
        const paginatedCreatures = await db
            .select()
            .from(creatures)
            .where(and(...conditions))
            // possible fix to duplicated creatures bug (#19)
            .orderBy(
                desc(creatures.isPinned),
                desc(creatures.createdAt),
                desc(creatures.id)
            )
            .limit(itemsPerPage)
            .offset(offset);
        // fetch total count of filtered creatures and calculate total pages
        const totalCountResult = await db
            .select({ count: count() })
            .from(creatures)
            .where(and(...conditions));
        const totalPages = Math.ceil(
            (totalCountResult[0]?.count ?? 0) / itemsPerPage
        );
        // enrich returned creatures
        const enrichedCreatures = paginatedCreatures.map(
            enrichAndSerializeCreature
        );
        // returned enriched, paginated, and filtered creatures for current page with total pages
        return { creatures: enrichedCreatures, totalPages };
    } catch (error) {
        console.error("Database Error: Failed to fetch creatures.", error);
        return { creatures: [], totalPages: 0 };
    }
}

// fetch research goals, paginated and filtered
export async function fetchFilteredResearchGoals(
    currentPage: number,
    query?: string,
    species?: string
) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("User is not authenticated.");

    // fetch items per page for logged in user and determine offset
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const goalsPerPage = user?.goalsItemsPerPage || 12;
    const offset = (currentPage - 1) * goalsPerPage;

    // filter research goals by search query or species if specified
    const conditions = [
        eq(researchGoals.userId, userId),
        query ? ilike(researchGoals.name, `%${query}%`) : undefined,
        species && species !== "all"
            ? eq(researchGoals.species, species)
            : undefined,
    ].filter(Boolean);

    try {
        // fetch filtered and paginated goals for current page
        const paginatedGoals = await db
            .select()
            .from(researchGoals)
            .where(and(...conditions))
            .orderBy(
                desc(researchGoals.isPinned),
                desc(researchGoals.createdAt),
                desc(researchGoals.id)
            )
            .limit(goalsPerPage)
            .offset(offset);
        // fetch total count of creatures and calculate total pages
        const totalCountResult = await db
            .select({ count: count() })
            .from(researchGoals)
            .where(and(...conditions));
        const totalGoals = totalCountResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalGoals / goalsPerPage);

        // enrich returned and paginated goals
        const enrichedGoals = paginatedGoals.map((goal) =>
            enrichAndSerializeGoal(goal, goal.goalMode)
        );

        return { goals: enrichedGoals, totalPages };
    } catch (error) {
        console.error("Database Error: Failed to fetch research goals.", error);
        return { goals: [], totalPages: 0 };
    }
}

// fetch paginated breeding pairs with statistics from breeding logs
export async function fetchBreedingPairsWithStats(currentPage: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { pairs: [], totalPages: 0 };

    // fetch logged in user and determine pairs per page and offset
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const pairsPerPage = user?.pairsItemsPerPage || 10;
    const offset = (currentPage - 1) * pairsPerPage;

    try {
        // fetch all pairs for current page, all research goals and breeding log entries for user
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

        // if no pairs are returned, return empty array
        if (paginatedPairs.length === 0) {
            return { pairs: [], totalPages: 0 };
        }

        // enrich and return goals and pairs
        const enrichedGoals = allGoals.map((goal) =>
            enrichAndSerializeGoal(goal, goal.goalMode)
        );
        const enrichedPairs = paginatedPairs.map((pair) =>
            enrichAndSerializeBreedingPair(pair, enrichedGoals, logEntries)
        );

        // determine total page count
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

// fetch all creatures for logged in user to populate dropdowns
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

// fetch all research goals for user to populate dropdowns
export async function getAllResearchGoalsForUser(): Promise<
    EnrichedResearchGoal[]
> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        const allUserGoals = await db.query.researchGoals.findMany({
            where: eq(researchGoals.userId, userId),
        });
        return allUserGoals.map((goal) =>
            enrichAndSerializeGoal(goal, goal.goalMode)
        );
    } catch (error) {
        console.error(
            "Database Error: Failed to fetch all research goals.",
            error
        );
        return [];
    }
}

// helper function to fetch TFO images and upload to Vercel blob with retries on failure
export async function fetchAndUploadWithRetry(
    imageUrl: string,
    creatureCode: string | null,
    retries = 3
): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // fetch the image from the external URL
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(
                    `Failed to download image. Status: ${imageResponse.status}`
                );
            }
            const imageBlob = await imageResponse.blob();

            // upload the image to Vercel Blob
            var filename = ""
            // if a creature code is provided, we are syncing
            if (creatureCode) {
                filename = `creatures/${creatureCode}.png`;
            }
            // if there is no creature code this is a research goal
            else {
                filename = `goals/${crypto.randomUUID()}.png`;
            }
            const blob = await vercelBlobPut(filename, imageBlob, {
                access: "public",
                contentType: imageBlob.type || "image/png",
                allowOverwrite: true,
            });

            // if successful, return the new URL immediately
            return blob.url;
        } catch (error) {
            console.warn(
                `Attempt ${attempt} failed for creature ${creatureCode}: ${error?.toString()}`
            );
            if (attempt === retries) {
                // if this was the last attempt, re-throw the error to be caught by the main logic
                throw new Error(
                    `All ${retries} attempts failed for ${creatureCode}.`
                );
            }
            // wait 1 second before the next retry
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
    }
    throw new Error("Upload failed after all retries.");
}