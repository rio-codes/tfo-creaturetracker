import {
    fetchFilteredCreatures,
    getAllCreaturesForUser,
    getAllBreedingPairsForUser,
    getAllResearchGoalsForUser,
    getAllBreedingLogEntriesForUser,
    getAllRawBreedingPairsForUser,
} from '@/lib/data';
import { CollectionClient } from '@/components/custom-clients/collection-client';
import { Suspense } from 'react';

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
    };
}) {
    const [
        { creatures: paginatedCreatures, totalPages, pinnedCreatures, unpinnedCreatures },
        allRawPairs,
        allCreatures,
        allPairs,
        allGoals,
        allLogs,
    ] = await Promise.all([
        fetchFilteredCreatures(searchParams),
        getAllRawBreedingPairsForUser(),
        getAllCreaturesForUser(),
        getAllBreedingPairsForUser(),
        getAllResearchGoalsForUser(),
        getAllBreedingLogEntriesForUser(),
    ]);

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading collection...</div>}>
                    <CollectionClient
                        totalPages={totalPages}
                        initialCreatures={paginatedCreatures}
                        pinnedCreatures={pinnedCreatures || []}
                        unpinnedCreatures={unpinnedCreatures || []}
                        allCreatures={allCreatures}
                        allRawPairs={allRawPairs}
                        allPairs={allPairs}
                        allGoals={allGoals}
                        allLogs={allLogs}
                    />
                </Suspense>
            </div>
        </div>
    );
}
