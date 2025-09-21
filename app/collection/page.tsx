import {
    fetchFilteredCreatures,
    getAllEnrichedCreaturesForUser,
    getAllBreedingPairsForUser,
    getAllResearchGoalsForUser,
    getAllBreedingLogEntriesForUser,
    getAllRawBreedingPairsForUser,
} from '@/lib/data';
import { CollectionClient } from '@/components/custom-clients/collection-client';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CollectionPage({
    searchParams,
}: {
    searchParams?: {
        page?: string;
        query?: string;
        stage?: string;
        gender?: string;
        species?: string;
        showArchived?: string;
    };
}) {
    const session = await auth();

    const [
        allRawPairs,
        allEnrichedCreatures,
        allEnrichedPairs,
        filteredData,
        allEnrichedGoals,
        allLogs,
        currentUser,
    ] = await Promise.all([
        getAllRawBreedingPairsForUser(),
        getAllEnrichedCreaturesForUser(),
        getAllBreedingPairsForUser(),
        fetchFilteredCreatures(searchParams),
        getAllResearchGoalsForUser(),
        getAllBreedingLogEntriesForUser(),
        session?.user?.id
            ? (db.query.users.findFirst({
                  where: eq(users.id, session.user.id),
                  columns: { password: false },
              }) as Promise<User | undefined>)
            : Promise.resolve(undefined),
    ]);

    const { pinnedCreatures, unpinnedCreatures, totalPages } = filteredData || {
        pinnedCreatures: [],
        unpinnedCreatures: [],
        totalPages: 0,
    };

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading collection...</div>}>
                    <CollectionClient
                        totalPages={totalPages}
                        pinnedCreatures={pinnedCreatures || []}
                        unpinnedCreatures={unpinnedCreatures || []}
                        allRawPairs={allRawPairs}
                        allEnrichedCreatures={allEnrichedCreatures}
                        allEnrichedPairs={allEnrichedPairs}
                        allEnrichedGoals={allEnrichedGoals}
                        allLogs={allLogs}
                        currentUser={currentUser ?? null}
                    />
                </Suspense>
            </div>
        </div>
    );
}
