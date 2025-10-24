import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { researchGoals, users } from '@/src/db/schema';
import { and, eq, ilike, or, inArray, SQL, like, desc } from 'drizzle-orm';
import { structuredGeneData } from '@/constants/creature-data';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const species = searchParams.get('species');
    const isSeasonal = searchParams.get('isSeasonal') === 'true';
    const generation = searchParams.get('generation');
    const geneCategory = searchParams.get('geneCategory');
    const geneQuery = searchParams.get('geneQuery');

    const sortBy = searchParams.get('sortBy') || 'updatedAt';

    try {
        const seasonalSpecies = Object.entries(structuredGeneData)
            .filter(([, data]) => (data as any).isSeasonal)
            .map(([speciesName]) => speciesName);

        let geneString: string | undefined;
        if (species && species !== 'all' && geneCategory && geneQuery && geneQuery !== 'any') {
            const speciesGeneInfo = structuredGeneData[species];
            const categoryGenes = speciesGeneInfo?.[geneCategory];
            if (typeof categoryGenes === 'object' && Array.isArray(categoryGenes)) {
                // For wishlist, we are always matching against the goal's phenotype
                const matchingGene = categoryGenes.find((g) => g.phenotype === geneQuery);
                if (matchingGene) {
                    // We construct a string to match the JSONB structure
                    geneString = `%"${geneCategory}":{"phenotype":"${geneQuery}"%`;
                } else {
                    // If no gene matches, return no results
                    return NextResponse.json([]);
                }
            }
        }

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
                                    phenotypeGeneStrings.push(
                                        `%"${category}":{"phenotype":"${gene.phenotype}"%`
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
        const whereConditions: (SQL | undefined)[] = [
            eq(researchGoals.isPublic, true),
            query
                ? or(
                      ilike(researchGoals.name, `%${query}%`),
                      ilike(researchGoals.species, `%${query}%`),
                      ilike(users.username, `%${query}%`),
                      ...phenotypeGeneStrings.map((str) => like(researchGoals.genes, str))
                  )
                : undefined,
            species && species !== 'all' ? eq(researchGoals.species, species) : undefined,
            isSeasonal ? inArray(researchGoals.species, seasonalSpecies) : undefined,
            generation ? eq(researchGoals.targetGeneration, Number(generation)) : undefined,
            geneString ? like(researchGoals.genes, geneString) : undefined,
        ].filter(Boolean);

        const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        // Dynamic orderBy clause
        const orderByClause =
            sortBy === 'species'
                ? [researchGoals.species, desc(researchGoals.updatedAt)]
                : [desc(researchGoals.updatedAt)];

        const wishlistGoals = await db
            .select({
                goal: researchGoals,
                owner: {
                    username: users.username,
                    id: users.id,
                    allowWishlistGoalSaving: users.allowWishlistGoalSaving,
                },
            })
            .from(researchGoals)
            .leftJoin(users, eq(researchGoals.userId, users.id))
            .where(where)
            .orderBy(...orderByClause);

        return NextResponse.json(wishlistGoals);
    } catch (error) {
        console.error('Failed to fetch wishlist goals:', error);
        return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
    }
}
