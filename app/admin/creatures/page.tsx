import { Suspense } from 'react';
import { db } from '@/src/db';
import { creatures, users } from '@/src/db/schema';
import { and, ilike, or, eq, desc, count, SQL } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreaturesPageClient } from './creatures-page-client';

async function fetchAdminCreatures(searchParams: { page?: string; query?: string }) {
    const page = Number(searchParams.page) || 1;
    const limit = 50;
    const query = searchParams.query;
    const offset = (page - 1) * limit;

    const whereConditions: (SQL | undefined)[] = [
        query
            ? or(
                  ilike(creatures.creatureName, `%${query}%`),
                  ilike(creatures.code, `%${query}%`),
                  ilike(users.username, `%${query}%`)
              )
            : undefined,
    ].filter(Boolean);

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const creatureList = await db
        .select({
            id: creatures.id,
            code: creatures.code,
            creatureName: creatures.creatureName,
            species: creatures.species,
            gender: creatures.gender,
            ownerUsername: users.username,
            createdAt: creatures.createdAt,
        })
        .from(creatures)
        .leftJoin(users, eq(creatures.userId, users.id))
        .where(where)
        .orderBy(desc(creatures.createdAt))
        .limit(limit)
        .offset(offset);

    const totalCountResult = await db
        .select({ count: count() })
        .from(creatures)
        .leftJoin(users, eq(creatures.userId, users.id))
        .where(where);
    const totalCreatures = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCreatures / limit);

    return { creatures: creatureList, pagination: { totalPages } };
}

export default async function AdminCreaturesPage(props: {
    searchParams: Promise<{ page?: string; query?: string }>;
}) {
    const searchParams = await props.searchParams;
    const { creatures, pagination } = await fetchAdminCreatures(searchParams);

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
            <CardHeader>
                <CardTitle className="text-pompaca-purple dark:text-purple-300">
                    Creature Management
                </CardTitle>
                <CardDescription className="text-dusk-purple dark:text-purple-400">
                    View and manage all creatures in the database.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<div>Loading creatures...</div>}>
                    <CreaturesPageClient creatures={creatures} pagination={pagination} />
                </Suspense>
            </CardContent>
        </Card>
    );
}
