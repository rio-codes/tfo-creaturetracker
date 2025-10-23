import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { researchGoals, users } from '@/src/db/schema';
import { and, eq, ilike, or, inArray, SQL } from 'drizzle-orm';
import { structuredGeneData } from '@/constants/creature-data';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const species = searchParams.get('species');
    const isSeasonal = searchParams.get('isSeasonal') === 'true';

    const seasonalSpecies = Object.entries(structuredGeneData)
        .filter(([, data]) => (data as any).isSeasonal)
        .map(([speciesName]) => speciesName);

    const whereConditions: (SQL | undefined)[] = [
        eq(researchGoals.isPublic, true),
        query
            ? or(
                  ilike(researchGoals.name, `%${query}%`),
                  ilike(researchGoals.species, `%%`),
                  ilike(users.username, `%%`)
              )
            : undefined,
        species && species !== 'all' ? eq(researchGoals.species, species) : undefined,
        isSeasonal ? inArray(researchGoals.species, seasonalSpecies) : undefined,
    ].filter(Boolean);

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    try {
        const wishlistGoals = await db
            .select({
                goal: researchGoals,
                owner: {
                    username: users.username,
                    id: users.id,
                },
            })
            .from(researchGoals)
            .leftJoin(users, eq(researchGoals.userId, users.id))
            .where(where)
            .orderBy(researchGoals.updatedAt);

        return NextResponse.json(wishlistGoals);
    } catch (error) {
        console.error('Failed to fetch wishlist goals:', error);
        return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
    }
}
