import 'server-only';

import { db } from '@/src/db';
import {
    creatures,
    breedingPairs,
    breedingLogEntries,
    researchGoals,
    users,
    achievedGoals,
} from '@/src/db/schema';
import { auth } from '@/auth';
import { and, ilike, or, eq, desc, count } from 'drizzle-orm';
import type {
    DbCreature,
    DbBreedingLogEntry,
    DbBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
    EnrichedBreedingPair,
} from '@/types';
import { checkForInbreeding, getPossibleOffspringSpecies } from '@/lib/breeding-rules';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/serialization';
import { calculateGeneProbability } from '@/lib/genetics';
import { put as vercelBlobPut } from '@vercel/blob';
import { alias } from 'drizzle-orm/pg-core';
import { structuredGeneData } from '../constants/creature-data';

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
        createdAt: log.createdAt.toISOString(), // Log entries don't have an updatedAt, but SerializedBreedingLogEntry requires it.
        updatedAt: log.createdAt.toISOString(),
    }));

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
export async function getAllBreedingPairsForUser(): Promise<EnrichedBreedingPair[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) return [];

        const [allPairsWithParents, allGoals, logEntries, allUserCreatures, allUserAchievedGoals] =
            await Promise.all([
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

        const enrichedGoals = allGoals.map((goal) => enrichAndSerializeGoal(goal, goal.goalMode));
        const enrichedCreatures = allUserCreatures.map(enrichAndSerializeCreature);
        const rawPairs = allPairsWithParents.map(({ maleParent, femaleParent, ...rest }) => rest);
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
        console.error(error);
        return [];
    }
}

// fetch assigned breeding pairs with enriched parents and genetic predictions for a research goal
export async function fetchGoalDetailsAndPredictions(goalId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Not authenticated.');

    try {
        const goal = await db.query.researchGoals.findFirst({
            where: and(eq(researchGoals.id, goalId), eq(researchGoals.userId, userId)),
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
            if (
                !p.maleParent ||
                !p.femaleParent ||
                !p.maleParent.species ||
                !p.femaleParent.species
            )
                return false;
            const possibleOffspring = getPossibleOffspringSpecies(
                p.maleParent.species,
                p.femaleParent.species
            );
            return possibleOffspring.includes(goal.species);
        });

        const predictions = relevantPairs
            .filter((p) => p.maleParent && p.femaleParent)
            .map((pair) => {
                const enrichedMaleParent = enrichAndSerializeCreature(pair.maleParent);
                const enrichedFemaleParent = enrichAndSerializeCreature(pair.femaleParent);
                let totalChance = 0;
                let geneCount = 0;
                const chancesByCategory: { [key: string]: number } = {};

                for (const [category, targetGeneInfo] of Object.entries(enrichedGoal!.genes)) {
                    const targetGene = targetGeneInfo as any;
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
                    goalId,
                    goalName: goal.name,
                };
            });

        return { goal: enrichedGoal, predictions };
    } catch (error) {
        console.error(error);
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
        showArchived?: string;
        generation?: string;
        g1Origin?: string;
        geneCategory?: string;
        geneQuery?: string;
        geneMode?: 'phenotype' | 'genotype';
    } = {}
) {
    const currentPage = Number(searchParams.page) || 1;
    const {
        query,
        gender,
        stage,
        species,
        showArchived,
        generation,
        g1Origin,
        geneCategory,
        geneQuery,
        geneMode,
    } = searchParams;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('User is not authenticated.');

    let geneConditions;
    if (
        geneCategory &&
        geneCategory !== 'any' &&
        geneQuery &&
        geneQuery !== 'any' &&
        species &&
        species !== 'all'
    ) {
        if (geneMode === 'genotype') {
            geneConditions = ilike(creatures.genetics, `%${geneCategory}:${geneQuery}%`);
        } else {
            // Phenotype search
            const speciesGeneInfo = structuredGeneData[species];
            const categoryGenes = speciesGeneInfo?.[geneCategory];
            if (categoryGenes) {
                const matchingGenotypes = categoryGenes
                    .filter((g) => g.phenotype === geneQuery)
                    .map((g) => g.genotype);

                if (matchingGenotypes.length > 0) {
                    geneConditions = or(
                        ...matchingGenotypes.map((gt) =>
                            ilike(creatures.genetics, `%${geneCategory}:${gt}%`)
                        )
                    );
                }
            }
        }
    }

    // get logged-in user from db, determine setting for creatures per page and offset
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const itemsPerPage = user?.collectionItemsPerPage ?? 12;

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
        showArchived !== 'true' ? eq(creatures.isArchived, false) : undefined,
        query
            ? or(
                  ilike(creatures.code, `%${query}%`),
                  ilike(creatures.creatureName, `%${query}%`),
                  ilike(creatures.genetics, `%${query}%`),
                  ilike(creatures.g1Origin, `%${query}%`)
              )
            : undefined,
        gender && gender !== 'all' ? eq(creatures.gender, gender as any) : undefined,
        growthLevel ? eq(creatures.growthLevel, growthLevel) : undefined,
        species && species !== 'all' ? ilike(creatures.species, species) : undefined,
        generation ? eq(creatures.generation, Number(generation)) : undefined,
        g1Origin && g1Origin !== 'all' ? eq(creatures.g1Origin, g1Origin as any) : undefined,
        geneConditions,
    ].filter(Boolean);

    try {
        // Fetch all pinned creatures matching filters
        const pinnedCreaturesRaw = await db
            .select()
            .from(creatures)
            .where(and(...conditions, eq(creatures.isPinned, true)))
            .orderBy(creatures.pinOrder, desc(creatures.createdAt));

        const pinnedCreatures = pinnedCreaturesRaw.map(enrichAndSerializeCreature);

        // Fetch paginated unpinned creatures
        const unpinnedConditions = [...conditions, eq(creatures.isPinned, false)];
        const offset = (currentPage - 1) * itemsPerPage;

        const unpinnedCreaturesRaw = await db
            .select()
            .from(creatures)
            .where(and(...unpinnedConditions))
            .orderBy(desc(creatures.createdAt), desc(creatures.id))
            .limit(itemsPerPage)
            .offset(offset);

        const unpinnedCreatures = unpinnedCreaturesRaw.map(enrichAndSerializeCreature);

        // Get total count for pagination (only for unpinned)
        const totalCountResult = await db
            .select({ count: count() })
            .from(creatures)
            .where(and(...unpinnedConditions));
        const totalUnpinned = totalCountResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalUnpinned / itemsPerPage);

        return { pinnedCreatures, unpinnedCreatures, totalPages };
    } catch (error) {
        console.error(error);
        return { pinnedCreatures: [], unpinnedCreatures: [], totalPages: 0 };
    }
}

// fetch research goals, paginated and filtered
export async function fetchFilteredResearchGoals(
    searchParams: {
        page?: string;
        query?: string;
        species?: string;
    } = {}
) {
    const currentPage = Number(searchParams.page) || 1;
    const { query, species } = searchParams;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('User is not authenticated.');

    // fetch items per page for logged in user and determine offset
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const itemsPerPage = user?.goalsItemsPerPage ?? 12;

    // filter research goals by search query or species if specified
    const conditions = [
        eq(researchGoals.userId, userId),
        query ? ilike(researchGoals.name, `%${query}%`) : undefined,
        species && species !== 'all' ? eq(researchGoals.species, species) : undefined,
    ].filter(Boolean);

    try {
        // Fetch all pinned goals matching filters
        const pinnedGoalsRaw = await db
            .select()
            .from(researchGoals)
            .where(and(...conditions, eq(researchGoals.isPinned, true)))
            .orderBy(researchGoals.pinOrder, desc(researchGoals.createdAt));

        const pinnedGoals = pinnedGoalsRaw.map((goal) =>
            enrichAndSerializeGoal(goal, goal.goalMode)
        );

        // Fetch paginated unpinned goals
        const unpinnedConditions = [...conditions, eq(researchGoals.isPinned, false)];
        const offset = (currentPage - 1) * itemsPerPage;

        const unpinnedGoalsRaw = await db
            .select()
            .from(researchGoals)
            .where(and(...unpinnedConditions))
            .orderBy(desc(researchGoals.createdAt), desc(researchGoals.id))
            .limit(itemsPerPage)
            .offset(offset);

        const unpinnedGoals = unpinnedGoalsRaw.map((goal) =>
            enrichAndSerializeGoal(goal, goal.goalMode)
        );

        // Get total count for pagination (only for unpinned)
        const totalCountResult = await db
            .select({ count: count() })
            .from(researchGoals)
            .where(and(...unpinnedConditions));
        const totalUnpinned = totalCountResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalUnpinned / itemsPerPage);

        return { pinnedGoals, unpinnedGoals, totalPages };
    } catch (error) {
        console.error(error);
        return { pinnedGoals: [], unpinnedGoals: [], totalPages: 0 };
    }
}

// fetch paginated breeding pairs with statistics from breeding logs
export async function fetchBreedingPairsWithStats(
    searchParams: {
        page?: string;
        query?: string;
        species?: string;
        geneCategory?: string;
        geneQuery?: string;
        geneMode?: 'phenotype' | 'genotype';
    } = {}
) {
    const currentPage = Number(searchParams.page) || 1;
    const { query, species, geneCategory, geneQuery, geneMode } = searchParams;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { pairs: [], totalPages: 0 };

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const itemsPerPage = user?.pairsItemsPerPage ?? 10;

    // Aliases for joining creatures table twice
    const maleCreatures = alias(creatures, 'male_creatures');
    const femaleCreatures = alias(creatures, 'female_creatures');

    // Build conditions for filtering
    const conditions = [
        eq(breedingPairs.userId, userId),
        species && species !== 'all'
            ? or(
                  eq(breedingPairs.species, species),
                  eq(maleCreatures.species, species),
                  eq(femaleCreatures.species, species)
              )
            : undefined,
        query
            ? or(
                  ilike(breedingPairs.pairName, `%${query}%`),
                  ilike(maleCreatures.creatureName, `%${query}%`),
                  ilike(maleCreatures.code, `%${query}%`),
                  ilike(femaleCreatures.creatureName, `%${query}%`),
                  ilike(femaleCreatures.code, `%${query}%`),
                  ilike(maleCreatures.genetics, `%${query}%`),
                  ilike(femaleCreatures.genetics, `%${query}%`)
              )
            : undefined,
        geneCategory && geneCategory !== 'any'
            ? or(
                  ilike(maleCreatures.genetics, `%${geneCategory}:%`),
                  ilike(femaleCreatures.genetics, `%${geneCategory}:%`)
              )
            : undefined,
        geneCategory && geneCategory !== 'any' && geneQuery && geneQuery !== 'any'
            ? geneMode === 'genotype'
                ? or(
                      ilike(maleCreatures.genetics, `%${geneCategory}:${geneQuery}%`),
                      ilike(femaleCreatures.genetics, `%${geneCategory}:${geneQuery}%`)
                  )
                : or(
                      ilike(maleCreatures.genetics, `%${geneCategory}:%${geneQuery}%`),
                      ilike(femaleCreatures.genetics, `%${geneCategory}:%${geneQuery}%`)
                  )
            : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined);

    try {
        // Fetch all pinned pairs matching filters
        const pinnedResults = await db
            .select({
                pair: breedingPairs,
                maleParent: maleCreatures,
                femaleParent: femaleCreatures,
            })
            .from(breedingPairs)
            .leftJoin(maleCreatures, eq(breedingPairs.maleParentId, maleCreatures.id))
            .leftJoin(femaleCreatures, eq(breedingPairs.femaleParentId, femaleCreatures.id))
            .where(and(...conditions, eq(breedingPairs.isPinned, true)))
            .orderBy(breedingPairs.pinOrder, desc(breedingPairs.createdAt), desc(breedingPairs.id));
        // .offset((currentPage - 1) * itemsPerPage); // Pinned items are not paginated

        const unpinnedResults = await db
            .select({
                pair: breedingPairs,
                maleParent: maleCreatures,
                femaleParent: femaleCreatures,
            })
            .from(breedingPairs)
            .leftJoin(maleCreatures, eq(breedingPairs.maleParentId, maleCreatures.id))
            .leftJoin(femaleCreatures, eq(breedingPairs.femaleParentId, femaleCreatures.id))
            .where(and(...conditions, eq(breedingPairs.isPinned, false)))
            .orderBy(desc(breedingPairs.createdAt), desc(breedingPairs.id))
            .limit(itemsPerPage)
            .offset((currentPage - 1) * itemsPerPage);

        const pinnedPairsWithParents = pinnedResults.map((result) => ({
            ...result.pair,
            maleParent: result.maleParent,
            femaleParent: result.femaleParent,
        }));

        const unpinnedPairsWithParents = unpinnedResults.map((result) => ({
            ...result.pair,
            maleParent: result.maleParent,
            femaleParent: result.femaleParent,
        }));

        // Fetch all goals and log entries for enrichment
        const [allGoals, logEntries, allUserCreatures, allUserAchievedGoals, allRawPairs] =
            await Promise.all([
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

        const enrichedGoals = allGoals.map((goal) => enrichAndSerializeGoal(goal, goal.goalMode));
        const enrichedCreatures = allUserCreatures.map(enrichAndSerializeCreature);

        const enrichedPinnedPairs = pinnedPairsWithParents
            .map((pair) => {
                const enrichedPair = enrichAndSerializeBreedingPair(
                    pair,
                    enrichedGoals,
                    logEntries,
                    enrichedCreatures,
                    allUserAchievedGoals,
                    allRawPairs
                );
                return enrichedPair;
            })
            .filter((p): p is EnrichedBreedingPair => p !== null);

        const enrichedUnpinnedPairs = unpinnedPairsWithParents
            .map((pair) => {
                const enrichedPair = enrichAndSerializeBreedingPair(
                    pair,
                    enrichedGoals,
                    logEntries,
                    enrichedCreatures,
                    allUserAchievedGoals,
                    allRawPairs
                );
                return enrichedPair;
            })
            .filter((p): p is EnrichedBreedingPair => p !== null);

        // fetch total count for pagination
        const totalCountResult = await db
            .select({ value: count() })
            .from(breedingPairs)
            .leftJoin(maleCreatures, eq(breedingPairs.maleParentId, maleCreatures.id))
            .leftJoin(femaleCreatures, eq(breedingPairs.femaleParentId, femaleCreatures.id))
            .where(and(...conditions, eq(breedingPairs.isPinned, false)));

        const totalPages = Math.ceil(totalCountResult[0].value / itemsPerPage);

        return {
            pinnedPairs: enrichedPinnedPairs,
            unpinnedPairs: enrichedUnpinnedPairs,
            totalPages,
        };
    } catch (error) {
        console.error(error);
        return { pinnedPairs: [], unpinnedPairs: [], totalPages: 0 };
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
        console.error(error);
        return [];
    }
}

// fetch all research goals for user to populate dropdowns
export async function getAllResearchGoalsForUser(): Promise<EnrichedResearchGoal[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        const allUserGoals = await db.query.researchGoals.findMany({
            where: eq(researchGoals.userId, userId),
        });
        return allUserGoals.map((goal) => enrichAndSerializeGoal(goal, goal.goalMode));
    } catch (error) {
        console.error(error);
        return [];
    }
}

// fetch all raw breeding pairs for user to populate dropdowns and for inbreeding checks
export async function getAllRawBreedingPairsForUser(): Promise<DbBreedingPair[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        const pairs = await db.query.breedingPairs.findMany({
            where: eq(breedingPairs.userId, userId),
        });
        return pairs;
    } catch (error) {
        console.error(error);
        return [];
    }
}

// fetch all breeding log entries for user for inbreeding checks
export async function getAllBreedingLogEntriesForUser(): Promise<DbBreedingLogEntry[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        const logEntries = await db.query.breedingLogEntries.findMany({
            where: eq(breedingLogEntries.userId, userId),
        });
        return logEntries;
    } catch (error) {
        console.error(error);
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
                throw new Error(`Failed to download image. Status: ${imageResponse.status}`);
            }
            const imageBlob = await imageResponse.blob();

            // upload the image to Vercel Blob
            let filename = '';
            if (referenceId?.startsWith('pair-preview-')) {
                filename = `pair-previews/${referenceId.replace('pair-preview-', '')}.png`;
            } else if (referenceId?.startsWith('goal-')) {
                filename = `goals/${referenceId.replace('goal-', '')}.png`;
            } else if (referenceId?.startsWith('admin-preview-')) {
                filename = `admin-previews/${referenceId.replace('admin-preview-', '')}.png`;
            } else if (referenceId) {
                // Assumes creature code for sync
                filename = `creatures/${referenceId}.png`;
            } else {
                // Assumes new goal
                filename = `goals/${crypto.randomUUID()}.png`;
            }

            const blob = await vercelBlobPut(filename, imageBlob, {
                access: 'public',
                contentType: imageBlob.type || 'image/png',
                allowOverwrite: false,
                addRandomSuffix: true,
            });

            // if successful, return the new URL immediately
            return blob.url;
        } catch (error) {
            console.error(error);
            if (attempt === retries) {
                // if this was the last attempt, re-throw the error to be caught by the main logic
                throw new Error(`All ${retries} attempts failed for ${referenceId}.`);
            }
            // wait 1 second before the next retry
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
    }
    throw new Error('Upload failed after all retries.');
}
export async function getAllEnrichedCreaturesForUser(): Promise<EnrichedCreature[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    try {
        const fetchedCreatures = await db.query.creatures.findMany({
            where: eq(creatures.userId, userId),
        });
        return fetchedCreatures.map(enrichAndSerializeCreature);
    } catch (error) {
        console.error(error);
        return [];
    }
}
