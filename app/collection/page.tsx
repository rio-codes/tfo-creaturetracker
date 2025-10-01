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
        generation?: string;
        g1Origin?: string;
        geneCategory?: string;
        geneQuery?: string;
        geneMode?: 'phenotype' | 'genotype';
    };
}) {
    const session = await auth();
    const plainSearchParams = {
        page: searchParams?.page,
        query: searchParams?.query,
        stage: searchParams?.stage,
        gender: searchParams?.gender,
        species: searchParams?.species,
        showArchived: searchParams?.showArchived,
        generation: searchParams?.generation,
        g1Origin: searchParams?.g1Origin,
        geneCategory: searchParams?.geneCategory,
        geneQuery: searchParams?.geneQuery,
        geneMode: searchParams?.geneMode,
    };

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
        fetchFilteredCreatures(plainSearchParams),
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
                        searchParams={plainSearchParams}
                        currentUser={currentUser ?? null}
                    />
                </Suspense>
            </div>
        </div>
    );
}
