import { Suspense } from 'react';
import { db } from '@/src/db';
import { breedingPairs, users } from '@/src/db/schema';
import { and, ilike, or, eq, desc, count, SQL } from 'drizzle-orm';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { BreedingPairsPageClient } from './breeding-pairs-page-client';

async function fetchAdminBreedingPairs(searchParams: {
    page?: string;
    query?: string;
}) {
    const page = Number(searchParams.page) || 1;
    const limit = 50;
    const query = searchParams.query;
    const offset = (page - 1) * limit;

    const whereConditions: (SQL | undefined)[] = [
        query
            ? or(
                  ilike(breedingPairs.pairName, `%${query}%`),
                  ilike(users.username, `%${query}%`)
              )
            : undefined,
    ].filter(Boolean);

    const where =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const pairList = await db
        .select({
            id: breedingPairs.id,
            pairName: breedingPairs.pairName,
            species: breedingPairs.species,
            ownerUsername: users.username,
            createdAt: breedingPairs.createdAt,
        })
        .from(breedingPairs)
        .leftJoin(users, eq(breedingPairs.userId, users.id))
        .where(where)
        .orderBy(desc(breedingPairs.createdAt))
        .limit(limit)
        .offset(offset);

    const totalCountResult = await db
        .select({ count: count() })
        .from(breedingPairs)
        .leftJoin(users, eq(breedingPairs.userId, users.id))
        .where(where);
    const totalPairs = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalPairs / limit);

    return { pairs: pairList, pagination: { totalPages } };
}

export default async function AdminBreedingPairsPage(
    props: {
        searchParams: Promise<{ page?: string; query?: string }>;
    }
) {
    const searchParams = await props.searchParams;
    const { pairs, pagination } = await fetchAdminBreedingPairs(searchParams);

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
            <CardHeader>
                <CardTitle className="text-pompaca-purple dark:text-purple-300">
                    Breeding Pair Management
                </CardTitle>
                <CardDescription className="text-dusk-purple dark:text-purple-400">
                    View and manage all breeding pairs in the database.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<div>Loading breeding pairs...</div>}>
                    <BreedingPairsPageClient
                        pairs={pairs}
                        pagination={pagination}
                    />
                </Suspense>
            </CardContent>
        </Card>
    );
}
