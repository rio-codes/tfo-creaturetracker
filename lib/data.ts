import 'server-only';

import { db } from '@/src/db';
import {
    creatures,
    breedingPairs,
    breedingLogEntries,
    researchGoals,
    users,
} from '@/src/db/schema';
import { and, ilike, like, or, eq, desc, count, SQL, sql, isNotNull } from 'drizzle-orm';
import type {
    DbBreedingLogEntry,
    DbBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
    EnrichedBreedingPair,
} from '@/types';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules-client';
import {
    enrichAndSerializeCreature,
    enrichAndSerializeGoal,
    enrichAndSerializeBreedingPair,
} from '@/lib/serialization';
import { calculateGeneProbability } from '@/lib/genetics';
import { put as vercelBlobPut } from '@vercel/blob';
import { alias } from 'drizzle-orm/pg-core';
import { structuredGeneData } from '@/constants/creature-data';
import { auth } from '@/auth';

export async function getAllBreedingPairsForUser(): Promise<EnrichedBreedingPair[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];

    try {
        const allPairsWithParents = await db.query.breedingPairs.findMany({
            where: eq(breedingPairs.userId, userId),
            with: {
                maleParent: true,
                femaleParent: true,
            },
        });

        const allUserGoals = await db.query.researchGoals.findMany({
            where: eq(researchGoals.userId, userId),
        });

        const enrichedPairPromises = allPairsWithParents.map(async (pair) => {
            const assignedGoalsForPair = allUserGoals.filter((goal) =>
                pair.assignedGoalIds?.includes(goal.id)
            );
            return enrichAndSerializeBreedingPair(
                { ...pair, assignedGoals: assignedGoalsForPair.map((goal) => ({ goal })) },
                userId
            );
        });

        const enrichedPairs = (await Promise.all(enrichedPairPromises)).filter(
            (p): p is EnrichedBreedingPair => p !== null
        );

        return enrichedPairs;
    } catch (error) {
        console.error(error);
        return [];
    }
}

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

        const allUserPairs = await db.query.breedingPairs.findMany({
            where: eq(breedingPairs.userId, userId),
            with: { maleParent: true, femaleParent: true },
        });

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

export async function fetchFilteredCreatures(
    searchParams: {
        page?: string;
        query?: string;
        gender?: string;
        stage?: string;
        species?: string;
        showArchived?: string;
        generation?: string;
        origin?: string;
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
        origin,
        geneCategory,
        geneQuery,
        geneMode = 'phenotype',
    } = searchParams;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('User is not authenticated.');

    let geneString: string[] = [];
    if (species && geneCategory && geneQuery && geneQuery !== 'any') {
        if (geneMode === 'genotype') {
            geneString = [`%${geneCategory}:${geneQuery}%`];
        } else {
            const speciesGeneInfo = structuredGeneData[species];
            const categoryGenes = speciesGeneInfo?.[geneCategory];
            if (typeof categoryGenes === 'object' && Array.isArray(categoryGenes)) {
                const matchingGenotypes = categoryGenes
                    .filter((g) => g.phenotype === geneQuery)
                    .map((g) => g.genotype);
                geneString = matchingGenotypes.map((gt) => `%${geneCategory}:${gt}%`);
            }
        }
    }

    console.log('Constructed geneString for query:', geneString);

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const itemsPerPage = user?.collectionItemsPerPage ?? 12;

    const phenotypeGeneStrings: string[] = [];
    if (query) {
        for (const speciesName in structuredGeneData) {
            const speciesGenes = structuredGeneData[speciesName];
            if (speciesGenes) {
                for (const category in speciesGenes) {
                    const genes = speciesGenes[category];
                    if (Array.isArray(genes)) {
                        for (const gene of genes as { genotype: string; phenotype: string }[]) {
                            if (gene.phenotype.toLowerCase().includes(query.toLowerCase())) {
                                phenotypeGeneStrings.push(`%${category}:${gene.genotype}%`);
                            }
                        }
                    }
                }
            }
        }
    }

    const isGenotypePattern = (q: string) => {
        const validGeneChars = /^[abcABC]+$/;
        return /^(?:[a-zA-Z]{2})+$/.test(q) && validGeneChars.test(q);
    };
    const isGeneSearch = query?.startsWith('gene:') || isGenotypePattern(query || '');
    const geneQueryValue = query?.startsWith('gene:') ? query.substring(5) : query;

    const stageToGrowthLevel: { [key: string]: number } = {
        capsule: 1,
        juvenile: 2,
        adult: 3,
    };
    const growthLevel = stage ? stageToGrowthLevel[stage] : undefined;

    const conditions = [
        eq(creatures.userId, userId),
        showArchived !== 'true' ? eq(creatures.isArchived, false) : undefined,
        query && isGeneSearch
            ? like(creatures.genetics, `%${geneQueryValue}%`)
            : query
              ? or(
                    ilike(creatures.code, `%${query}%`),
                    ilike(creatures.creatureName, `%${query}%`),
                    ilike(sql`${creatures.origin}::text`, `%${query}%`),
                    ilike(creatures.species, `%${query}%`),
                    ...phenotypeGeneStrings.map((str) => like(creatures.genetics, str))
                )
              : undefined,
        gender && gender !== 'all' ? eq(creatures.gender, gender as any) : undefined,
        growthLevel ? eq(creatures.growthLevel, growthLevel) : undefined,
        species && species !== 'all' ? ilike(creatures.species, species) : undefined,
        generation ? eq(creatures.generation, Number(generation)) : undefined,
        origin && origin !== 'all' ? eq(creatures.origin, origin as any) : undefined,
    ].filter(Boolean);

    if (geneQuery && geneCategory && geneString.length > 0) {
        if (geneString.length > 1) {
            const geneConditions = geneString.map((str) => like(creatures.genetics, str));
            conditions.push(or(...geneConditions));
        } else {
            conditions.push(like(creatures.genetics, geneString[0]));
        }
    }

    console.log('Final query conditions count:', conditions.length);

    try {
        const pinnedCreaturesRaw = await db
            .select()
            .from(creatures)
            .where(and(...conditions, eq(creatures.isPinned, true))) // `conditions` is an array of SQL chunks
            .orderBy(creatures.pinOrder, desc(creatures.createdAt));

        const pinnedCreatures = pinnedCreaturesRaw.map(enrichAndSerializeCreature);
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

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    const itemsPerPage = user?.goalsItemsPerPage ?? 12;

    const conditions = [
        eq(researchGoals.userId, userId),
        query ? ilike(researchGoals.name, `%${query}%`) : undefined,
        species && species !== 'all' ? eq(researchGoals.species, species) : undefined,
    ].filter(Boolean);

    try {
        const pinnedGoalsRaw = await db
            .select()
            .from(researchGoals)
            .where(and(...conditions, eq(researchGoals.isPinned, true)))
            .orderBy(researchGoals.pinOrder, desc(researchGoals.createdAt));

        const pinnedGoals = pinnedGoalsRaw.map((goal) =>
            enrichAndSerializeGoal(goal, goal.goalMode)
        );

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

export async function fetchBreedingPairsWithStats(
    searchParams: {
        page?: string;
        query?: string;
        species?: string;
        geneCategory?: string;
        geneQuery?: string;
        geneMode?: 'phenotype' | 'genotype';
        showArchived?: string;
    } = {}
) {
    const currentPage = Number(searchParams.page) || 1;
    const { query, species, geneCategory, geneQuery, geneMode, showArchived } = searchParams;
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
    const conditions: SQL<unknown>[] | undefined = [
        eq(breedingPairs.userId, userId),
        showArchived !== 'true' ? eq(breedingPairs.isArchived, false) : undefined,
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
    ].filter((c): c is NonNullable<typeof c> => c !== undefined);

    if (species && geneCategory && geneQuery && geneQuery !== 'any') {
        let geneStrings: string[] = [];
        if (geneMode === 'genotype') {
            geneStrings = [`%${geneCategory}:${geneQuery}%`];
        } else {
            // Phenotype mode
            const speciesGeneInfo = structuredGeneData[species];
            const categoryGenes = speciesGeneInfo?.[geneCategory];
            if (typeof categoryGenes === 'object' && Array.isArray(categoryGenes)) {
                const matchingGenotypes = categoryGenes
                    .filter((g) => g.phenotype === geneQuery)
                    .map((g) => g.genotype);
                geneStrings = matchingGenotypes.map((gt) => `%${geneCategory}:${gt}%`);
            }
        }

        if (!geneStrings || geneStrings.length === 0) {
            return { pairs: [], totalPages: 0 };
        }

        const geneConditions: SQL<unknown>[] = geneStrings.flatMap((str) => [
            like(maleCreatures.genetics, str),
            like(femaleCreatures.genetics, str),
        ]);

        conditions.push(or(...geneConditions) as SQL<unknown>);
    }

    try {
        const commonQuery = db
            .select({
                pair: breedingPairs,
                maleParent: maleCreatures,
                femaleParent: femaleCreatures,
            })
            .from(breedingPairs)
            .leftJoin(
                maleCreatures,
                and(
                    eq(breedingPairs.maleParentUserId, maleCreatures.userId),
                    eq(breedingPairs.maleParentCode, maleCreatures.code)
                )
            )
            .leftJoin(
                femaleCreatures,
                and(
                    eq(breedingPairs.femaleParentUserId, femaleCreatures.userId),
                    eq(breedingPairs.femaleParentCode, femaleCreatures.code)
                )
            );

        const pinnedResults = await commonQuery
            .where(and(...conditions, eq(breedingPairs.isPinned, true)))
            .orderBy(breedingPairs.pinOrder, desc(breedingPairs.createdAt), desc(breedingPairs.id));

        const unpinnedResults = await commonQuery
            .where(and(...conditions, eq(breedingPairs.isPinned, false)))
            .orderBy(desc(breedingPairs.createdAt), desc(breedingPairs.id))
            .limit(itemsPerPage)
            .offset((currentPage - 1) * itemsPerPage);

        const allResults = [...pinnedResults, ...unpinnedResults];

        const enrichedPairPromises = allResults.map(async (result) => {
            const pairWithParents = {
                ...result.pair,
                maleParent: result.maleParent,
                femaleParent: result.femaleParent,
            };
            return enrichAndSerializeBreedingPair(pairWithParents as any, userId);
        });

        const allEnrichedPairs = (await Promise.all(enrichedPairPromises)).filter(
            (p): p is EnrichedBreedingPair => p !== null
        );

        const enrichedPinnedPairs = allEnrichedPairs.filter((p) => p.isPinned);
        const enrichedUnpinnedPairs = allEnrichedPairs.filter((p) => !p.isPinned);

        const totalCountResult = await db
            .select({ value: count() })
            .from(breedingPairs)
            .leftJoin(
                maleCreatures,
                and(
                    eq(breedingPairs.maleParentUserId, maleCreatures.userId),
                    eq(breedingPairs.maleParentCode, maleCreatures.code)
                )
            )
            .leftJoin(
                femaleCreatures,
                and(
                    eq(breedingPairs.femaleParentUserId, femaleCreatures.userId),
                    eq(breedingPairs.femaleParentCode, femaleCreatures.code)
                )
            )
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

export async function fetchAndUploadWithRetry(
    imageUrl: string,
    referenceId: string | null,
    retries = 3
): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(`Failed to download image. Status: ${imageResponse.status}`);
            }
            const imageBlob = await imageResponse.blob();

            let filename = '';
            if (referenceId?.startsWith('pair-preview-')) {
                filename = `pair-previews/${referenceId.replace('pair-preview-', '')}.png`;
            } else if (referenceId?.startsWith('goal-')) {
                filename = `goals/${referenceId.replace('goal-', '')}.png`;
            } else if (referenceId?.startsWith('admin-preview-')) {
                filename = `admin-previews/${referenceId.replace('admin-preview-', '')}.png`;
            } else if (referenceId) {
                filename = `creatures/${referenceId}.png`;
            } else {
                filename = `goals/${crypto.randomUUID()}.png`;
            }

            const blob = await vercelBlobPut(filename, imageBlob, {
                access: 'public',
                contentType: imageBlob.type || 'image/png',
                allowOverwrite: false,
                addRandomSuffix: true,
            });

            return blob.url;
        } catch (error) {
            console.error(error);
            if (attempt === retries) {
                throw new Error(`All ${retries} attempts failed for ${referenceId}.`);
            }
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

type HomepageStats = {
    totalCreatures: number;
    totalPairs: number;
    totalGoals: number;
    popularSpecies: {
        species: string | null;
        count: number;
    } | null;
    prolificPair: {
        id: string;
        name: string | null;
        timesBred: number;
        breeder: {
            username: string | null;
            id: string;
        } | null;
    } | null;
    randomCreature: {
        image: string | null;
        species: string | null;
        code: string;
    } | null;
};

type ProlificPair = {
    id: string;
    name: string | null;
    timesBred: number;
    breeder: {
        username: string | null;
        id: string;
    } | null;
} | null;

export async function getHomepageStats(): Promise<HomepageStats> {
    const [totalCreaturesResult, totalPairsResult, totalGoalsResult] = await Promise.all([
        db.select({ value: count() }).from(creatures),
        db.select({ value: count() }).from(breedingPairs),
        db.select({ value: count() }).from(researchGoals),
    ]);

    const popularSpeciesQuery = await db
        .select({
            species: creatures.species,
            count: sql<number>`count(${creatures.id})`.mapWith(Number).as('species_count'),
        })
        .from(creatures)
        .where(isNotNull(creatures.species))
        .groupBy(creatures.species)
        .orderBy(desc(sql`species_count`))
        .limit(1);

    const prolificPairLogQuery = await db
        .select({
            pairId: breedingLogEntries.pairId,
            timesBred: sql<number>`count(${breedingLogEntries.id})`
                .mapWith(Number)
                .as('times_bred'),
        })
        .from(breedingLogEntries)
        .where(isNotNull(breedingLogEntries.pairId))
        .groupBy(breedingLogEntries.pairId)
        .orderBy(desc(sql`times_bred`))
        .limit(1);
    let prolificPair: ProlificPair = null;
    if (prolificPairLogQuery.length > 0) {
        const { pairId, timesBred } = prolificPairLogQuery[0];
        if (pairId) {
            const pairInfo = await db.query.breedingPairs.findFirst({
                where: eq(breedingPairs.id, pairId),
                columns: {
                    id: true,
                    pairName: true,
                    userId: true,
                },
            });
            if (pairInfo && pairInfo.userId) {
                const breederInfo = await db.query.users.findFirst({
                    where: eq(users.id, pairInfo.userId),
                    columns: { id: true, username: true },
                });
                prolificPair = {
                    id: pairInfo.id,
                    name: pairInfo.pairName,
                    timesBred: timesBred,
                    breeder: breederInfo
                        ? { id: breederInfo.id, username: breederInfo.username }
                        : null,
                };
            }
        }
    }

    // The random creature generation is computationally expensive and involves external API calls.
    // For the main data library, we'll stub this out. The page component can handle it.
    const randomCreature = null;

    return {
        totalCreatures: totalCreaturesResult[0].value,
        totalPairs: totalPairsResult[0].value,
        totalGoals: totalGoalsResult[0].value,
        popularSpecies: popularSpeciesQuery.length > 0 ? popularSpeciesQuery[0] : null,
        prolificPair,
        randomCreature,
    };
}
