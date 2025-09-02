import "server-only";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/src/db";
import {
    creatures,
    breedingPairs,
    breedingLogEntries,
    researchGoals,
    users,
    achievedGoals,
} from "@/src/db/schema";
import { auth } from "@/auth";
import { and, ilike, or, eq, desc, count } from "drizzle-orm";
import type {
    DbCreature,
    DbBreedingLogEntry,
    DbBreedingPair,
    DbResearchGoal,
    EnrichedCreature,
    EnrichedResearchGoal,
    EnrichedBreedingPair,
} from "@/types";
import {
    checkForInbreeding,
    validatePairing,
    getPossibleOffspringSpecies,
} from "@/lib/breeding-rules";
import {
    enrichAndSerializeCreature,
    enrichAndSerializeGoal,
} from "@/lib/serialization";
import { calculateGeneProbability } from "@/lib/genetics";
import { put as vercelBlobPut } from "@vercel/blob";
import { alias } from "drizzle-orm/pg-core";

// ============================================================================
// === HELPER FUNCTIONS =======================================================
// ============================================================================

const enrichAndSerializeBreedingPair = (
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
        Sentry.logger.warn(`Skipping pair ${pair.id} due to missing parent data.`);
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
    const serializedLogs = relevantLogs.map(log => ({ ...log, createdAt: log.createdAt.toISOString() }));

    const progenyCount = progeny.length;

    const assignedGoalsFromPair = allEnrichedGoals.filter(
        (goal): goal is NonNullable<EnrichedResearchGoal> =>
            goal !== null && (pair.assignedGoalIds?.includes(goal.id) ?? false)
    );

    // Check which assigned goals have been achieved by this pair's progeny
    const achievedGoalIdsForPair = new Set(
        allUserAchievedGoals
            .filter((ag) => progenyIds.has(ag.matchingProgenyId))
            .map((ag) => ag.goalId)
    );

    const assignedGoals = assignedGoalsFromPair.map((goal) => {
        const isAchieved = achievedGoalIdsForPair.has(goal.id);

        // Calculate prediction for this goal
        let totalChance = 0;
        let geneCount = 0;
        let isPossible = true;
        const goalMode = goal.goalMode;

        for (const [category, targetGeneInfo] of Object.entries(goal.genes)) {
            const targetGene = targetGeneInfo as any;
            const chance = calculateGeneProbability(
                enrichAndSerializeCreature(pair.maleParent),
                enrichAndSerializeCreature(pair.femaleParent),
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

        return {
            ...goal,
            isAchieved,
            isPossible,
            averageChance,
        };
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

        const [
            allPairsWithParents,
            allGoals,
            logEntries,
            allUserCreatures,
            allUserAchievedGoals,
        ] = await Promise.all([
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
            db.query.creatures.findMany({
                where: eq(creatures.userId, userId),
            }),
            db.query.achievedGoals.findMany({
                where: eq(achievedGoals.userId, userId),
            }),
        ]);

        const enrichedGoals = allGoals.map((goal) =>
            enrichAndSerializeGoal(goal, goal.goalMode)
        );
        const enrichedCreatures = allUserCreatures.map(
            enrichAndSerializeCreature
        );
        const rawPairs = allPairsWithParents.map(
            ({ maleParent, femaleParent, ...rest }) => rest
        );
        const enrichedPairs = allPairsWithParents
            .map((pair) =>
                enrichAndSerializeBreedingPair(
                    pair,
                    enrichedGoals,
                    logEntries,
                    enrichedCreatures,
                    allUserAchievedGoals,
                    rawPairs
                )
            )
            .filter((p): p is EnrichedBreedingPair => p !== null);

        return enrichedPairs;
    } catch (error) {
        Sentry.captureException(error, {
            extra: { context: "Failed to fetch all breeding pairs." },
        });
        return [];
    }
}

// fetch assigned breeding pairs with enriched parents and genetic predictions for a research goal
export async function fetchGoalDetailsAndPredictions(goalId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not authenticated.");

    try {
        const goal = await db.query.researchGoals.findFirst({
            where: and(
                eq(researchGoals.id, goalId),
                eq(researchGoals.userId, userId)
            ),
        });
        if (!goal) return { goal: null, predictions: [] };

        const goalMode = goal.goalMode;
        const enrichedGoal = enrichAndSerializeGoal(goal, goalMode);

        // Fetch all pairs and filter in code, because a pair's `species` property
        // might not match the goal's species in the case of hybrids.
        const allUserPairs = await db.query.breedingPairs.findMany({
            where: eq(breedingPairs.userId, userId),
            with: { maleParent: true, femaleParent: true },
        });

        // Filter pairs that can produce the goal's species
        const relevantPairs = allUserPairs.filter((p) => {
            if (!p.maleParent || !p.femaleParent) return false;
            const possibleOffspring = getPossibleOffspringSpecies(p.maleParent.species, p.femaleParent.species);
            return possibleOffspring.includes(goal.species);
        });

        const predictions = relevantPairs
            .filter((p) => p.maleParent && p.femaleParent)
            .map((pair) => {
                const enrichedMaleParent = enrichAndSerializeCreature(
                    pair.maleParent
                );
                const enrichedFemaleParent = enrichAndSerializeCreature(
                    pair.femaleParent
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
                        targetGene as any,
                        goalMode
                    );
                    chancesByCategory[category] = chance;

                    // Only factor in non-optional genes for the average
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

        return { goal: enrichedGoal, predictions };
    } catch (error) {
        Sentry.captureException(error, {
            extra: { context: "Failed to fetch goal details." },
        });
        return { goal: null, predictions: [] };
    }
}

// fetch creatures filtered by specified criteria and paginated for UI
export async function fetchFilteredCreatures(
    searchParams: {
        page?: string;
        query?: string;
        gender?: string;
        stage?: string;
        species?: string;
    } = {},
) {
    const currentPage = Number(searchParams.page) || 1;
    const { query, gender, stage, species } = searchParams;
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
        gender && gender !== "all"
            ? eq(creatures.gender, gender as any)
            : undefined,
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
        Sentry.captureException(error, {
            extra: { context: "Failed to fetch creatures." },
        });
        return { creatures: [], totalPages: 0 };
    }
}

// fetch research goals, paginated and filtered
export async function fetchFilteredResearchGoals(
    searchParams: {
        page?: string;
        query?: string;
        species?: string;
    } = {},
) {
    const currentPage = Number(searchParams.page) || 1;
    const { query, species } = searchParams;
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
        Sentry.captureException(error, {
            extra: { context: "Failed to fetch research goals." },
        });
        return { goals: [], totalPages: 0 };
    }
}

// fetch paginated breeding pairs with statistics from breeding logs
export async function fetchBreedingPairsWithStats(
    searchParams: {
        page?: string;
        query?: string;
        species?: string;
    } = {},
) {
    const currentPage = Number(searchParams.page) || 1;
    const { query, species } = searchParams;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { pairs: [], totalPages: 0 };

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const pairsPerPage = user?.pairsItemsPerPage || 10;
    const offset = (currentPage - 1) * pairsPerPage;

    // Aliases for joining creatures table twice
    const maleCreatures = alias(creatures, "male_creatures");
    const femaleCreatures = alias(creatures, "female_creatures");

    // Build conditions for filtering
    const conditions = [
        eq(breedingPairs.userId, userId),
        species && species !== 'all'
            ? or(
                  eq(maleCreatures.species, species),
                  eq(femaleCreatures.species, species)
              )
            : undefined,
        query
            ? or(
                  ilike(breedingPairs.pairName, `%${query}%`),
                  ilike(maleCreatures.creatureName, `%${query}%`),
                  ilike(maleCreatures.code, `%${query}%`), // Corrected this line
                  ilike(femaleCreatures.creatureName, `%${query}%`),
                  ilike(femaleCreatures.code, `%${query}%`) // Corrected this line
              )
            : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined);

    try {
        // Fetch paginated pairs with their parents
        const paginatedResults = await db
            .select({
                pair: breedingPairs,
                maleParent: maleCreatures,
                femaleParent: femaleCreatures,
            })
            .from(breedingPairs)
            .leftJoin(
                maleCreatures,
                eq(breedingPairs.maleParentId, maleCreatures.id)
            )
            .leftJoin(
                femaleCreatures,
                eq(breedingPairs.femaleParentId, femaleCreatures.id)
            )
            .where(and(...conditions))
            .orderBy(
                desc(breedingPairs.isPinned),
                desc(breedingPairs.createdAt)
            )
            .limit(pairsPerPage)
            .offset(offset);

        const pairsWithParents = paginatedResults.map((result) => ({
            ...result.pair,
            maleParent: result.maleParent,
            femaleParent: result.femaleParent,
        }));

        // Fetch all goals and log entries for enrichment
        const [
            allGoals,
            logEntries,
            allUserCreatures,
            allUserAchievedGoals,
            allRawPairs,
        ] = await Promise.all([
            db.query.researchGoals.findMany({
                where: eq(researchGoals.userId, userId),
            }),
            db.query.breedingLogEntries.findMany({
                where: eq(breedingLogEntries.userId, userId),
            }),
            db.query.creatures.findMany({
                where: eq(creatures.userId, userId),
            }),
            db.query.achievedGoals.findMany({
                where: eq(achievedGoals.userId, userId),
            }),
            db.query.breedingPairs.findMany({
                // Fetch all pairs for inbreeding check
                where: eq(breedingPairs.userId, userId),
            }),
        ]);

        if (pairsWithParents.length === 0) {
            return { pairs: [], totalPages: 0 };
        }

        const enrichedGoals = allGoals.map((goal) =>
            enrichAndSerializeGoal(goal, goal.goalMode)
        );
        const enrichedCreatures = allUserCreatures.map(
            enrichAndSerializeCreature
        );
        const enrichedPairs = pairsWithParents
            .map((pair) =>
                enrichAndSerializeBreedingPair(
                    pair,
                    enrichedGoals,
                    logEntries,
                    enrichedCreatures,
                    allUserAchievedGoals,
                    allRawPairs
                )
            )
            .filter((p): p is EnrichedBreedingPair => p !== null);

        // fetch total count for pagination
        const totalCountResult = await db
            .select({ value: count() })
            .from(breedingPairs)
            .leftJoin(
                maleCreatures,
                eq(breedingPairs.maleParentId, maleCreatures.id)
            )
            .leftJoin(
                femaleCreatures,
                eq(breedingPairs.femaleParentId, femaleCreatures.id)
            )
            .where(and(...conditions));

        const totalPages = Math.ceil(totalCountResult[0].value / pairsPerPage);

        return { pairs: enrichedPairs, totalPages };
    } catch (error) {
        Sentry.captureException(error, {
            extra: { context: "Failed to fetch breeding pairs with stats." },
        });
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
        Sentry.captureException(error, {
            extra: { context: "Failed to fetch all creatures." },
        });
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
        Sentry.captureException(error, {
            extra: { context: "Failed to fetch all research goals." },
        });
        return [];
    }
}

// fetch all raw breeding pairs for user to populate dropdowns and for inbreeding checks
export async function getAllRawBreedingPairsForUser(): Promise<
    DbBreedingPair[]
> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        const pairs = await db.query.breedingPairs.findMany({
            where: eq(breedingPairs.userId, userId),
        });
        return pairs;
    } catch (error) {
        Sentry.captureException(error, {
            extra: { context: "Failed to fetch all raw breeding pairs." },
        });
        return [];
    }
}

// fetch all breeding log entries for user for inbreeding checks
export async function getAllBreedingLogEntriesForUser(): Promise<
    DbBreedingLogEntry[]
> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        const logEntries = await db.query.breedingLogEntries.findMany({
            where: eq(breedingLogEntries.userId, userId),
        });
        return logEntries;
    } catch (error) {
        Sentry.captureException(error, {
            extra: { context: "Failed to fetch all breeding log entries." },
        });
        return [];
    }
}

// helper function to fetch TFO images and upload to Vercel blob with retries on failure
export async function fetchAndUploadWithRetry(
    imageUrl: string,
    referenceId: string | null, // Can be creature code, goal ID, or a special preview ID
    retries = 3
): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // fetch the image from the external URL, ensuring we bypass any cache
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(
                    `Failed to download image. Status: ${imageResponse.status}`
                );
            }
            const imageBlob = await imageResponse.blob();

            // upload the image to Vercel Blob
            let filename = "";
            if (referenceId?.startsWith("pair-preview-")) {
                filename = `pair-previews/${referenceId.replace(
                    "pair-preview-",
                    ""
                )}.png`;
            } else if (referenceId?.startsWith("goal-")) {
                filename = `goals/${referenceId.replace("goal-", "")}.png`;
            } else if (referenceId?.startsWith("admin-preview-")) {
                filename = `admin-previews/${referenceId.replace("admin-preview-", "")
                }.png`;
            } else if (referenceId) {
                // Assumes creature code for sync
                filename = `creatures/${referenceId}.png`;
            } else {
                // Assumes new goal
                filename = `goals/${crypto.randomUUID()}.png`;
            }

            const blob = await vercelBlobPut(filename, imageBlob, {
                access: "public",
                contentType: imageBlob.type || "image/png",
                allowOverwrite: false,
                addRandomSuffix: true,
            });

            // if successful, return the new URL immediately
            return blob.url;
        } catch (error) {
            Sentry.logger.warn(
                `Attempt ${attempt} failed for reference ${referenceId}: ${error?.toString()}`
            );
            if (attempt === retries) {
                // if this was the last attempt, re-throw the error to be caught by the main logic
                throw new Error(
                    `All ${retries} attempts failed for ${referenceId}.`
                );
            }
            // wait 1 second before the next retry
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
    }
    throw new Error("Upload failed after all retries.");
}
