import { fetchBreedingPairsWithStats } from '@/lib/data';
import { BreedingPairsClient } from '@/components/custom-clients/breeding-pair-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function BreedingPairsPage(props: {
    searchParams?: Promise<{
        page?: string;
        query?: string;
        species?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const [{ pinnedPairs, unpinnedPairs, totalPages }] = await Promise.all([
        fetchBreedingPairsWithStats(searchParams),
    ]);

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading pairs...</div>}>
                    <BreedingPairsClient
                        pinnedPairs={pinnedPairs!}
                        unpinnedPairs={unpinnedPairs!}
                        totalPages={totalPages}
                        searchParams={searchParams}
                    />
                </Suspense>
            </div>
        </div>
    );
}
