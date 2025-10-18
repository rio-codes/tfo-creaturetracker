import { fetchBreedingPairsWithStats } from '@/lib/data';
import { BreedingPairsClient } from '@/components/custom-clients/breeding-pair-client';
import { Suspense } from 'react';
import {
    getAllCreaturesForUser,
    getAllResearchGoalsForUser,
    getAllRawBreedingPairsForUser,
    getAllBreedingLogEntriesForUser,
} from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function BreedingPairsPage(props: {
    searchParams?: Promise<{
        page?: string;
        query?: string;
        species?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const [{ pinnedPairs, unpinnedPairs, totalPages }, allCreatures, allGoals, allPairs, allLogs] =
        await Promise.all([
            fetchBreedingPairsWithStats(searchParams),
            getAllCreaturesForUser(),
            getAllResearchGoalsForUser(),
            getAllRawBreedingPairsForUser(),
            getAllBreedingLogEntriesForUser(),
        ]);

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading pairs...</div>}>
                    <BreedingPairsClient
                        pinnedPairs={pinnedPairs!}
                        unpinnedPairs={unpinnedPairs!}
                        totalPages={totalPages}
                        allCreatures={allCreatures}
                        allGoals={allGoals}
                        allPairs={allPairs}
                        allLogs={allLogs}
                        searchParams={searchParams}
                    />
                </Suspense>
            </div>
        </div>
    );
}
