import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { researchGoals, users } from '@/src/db/schema';
import { and, eq, ilike, or, inArray, SQL, like, desc, count } from 'drizzle-orm';
import { structuredGeneData } from '@/constants/creature-data';
import { auth } from '@/auth';

export async function GET(req: Request) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const species = searchParams.get('species');
    const isSeasonal = searchParams.get('isSeasonal') === 'true';
    const generation = searchParams.get('generation');
    const geneCategory = searchParams.get('geneCategory');
    const geneQuery = searchParams.get('geneQuery');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 15;

    try {
        const seasonalSpecies = Object.entries(structuredGeneData)
            .filter(([, data]) => (data as any).isSeasonal)
            .map(([speciesName]) => speciesName);

        let geneString: string | undefined;
        if (species && species !== 'all' && geneCategory && geneQuery && geneQuery !== 'any') {
            const speciesGeneInfo = structuredGeneData[species];
            const categoryGenes = speciesGeneInfo?.[geneCategory];
            if (typeof categoryGenes === 'object' && Array.isArray(categoryGenes)) {
                const matchingGene = categoryGenes.find((g) => g.phenotype === geneQuery);
                if (matchingGene) {
                    geneString = `%"${geneCategory}":{"phenotype":"${geneQuery}"%`;
                } else {
                    return NextResponse.json({ items: [], totalPages: 0 });
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
            eq(researchGoals.isPinned, false),
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
            generation && generation !== 'any'
                ? eq(researchGoals.targetGeneration, Number(generation))
                : undefined,
            geneString ? like(researchGoals.genes, geneString) : undefined,
        ].filter(Boolean);

        const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        const orderByClause =
            sortBy === 'species'
                ? [researchGoals.species, desc(researchGoals.updatedAt)]
                : [desc(researchGoals.updatedAt)];

        const [items, totalCountResult] = await Promise.all([
            db
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
                .orderBy(...orderByClause)
                .limit(limit)
                .offset((page - 1) * limit),
            db
                .select({ count: count() })
                .from(researchGoals)
                .leftJoin(users, eq(researchGoals.userId, users.id))
                .where(where),
        ]);

        const totalPages = Math.ceil((totalCountResult[0]?.count ?? 0) / limit);

        return NextResponse.json({ items, totalPages });
    } catch (error) {
        console.error('Failed to fetch wishlist goals:', error);
        return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
    }
}
