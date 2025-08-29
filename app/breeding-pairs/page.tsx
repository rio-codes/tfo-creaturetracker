import { fetchBreedingPairsWithStats } from "@/lib/data";
import { BreedingPairsClient } from "@/components/custom-clients/breeding-pair-client";
import { Suspense } from "react";
import { getAllCreaturesForUser, getAllResearchGoalsForUser } from "@/lib/data";
import { EnrichedBreedingPair } from "@/types";

export const dynamic = "force-dynamic";

export default async function BreedingPairsPage({
    searchParams,
}: {
    searchParams?: {
        page?: string;
        query?: string;
        species?: string;
    };
}) {
    const currentPage = Number(searchParams?.page) || 1;
    const query = searchParams?.query || "";
    const species = searchParams?.species || "";

    const { pairs, totalPages } = await fetchBreedingPairsWithStats(
        currentPage,
        query,
        species
    );

    const allCreatures = await getAllCreaturesForUser();
    const allGoals = await getAllResearchGoalsForUser();

    return (
        <div className="bg-barely-lilac min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading pairs...</div>}>
                    <BreedingPairsClient
                        initialPairs={pairs}
                        totalPages={totalPages}
                        allCreatures={allCreatures}
                        allGoals={allGoals}
                        searchParams={searchParams}
                    />
                </Suspense>
            </div>
        </div>
    );
}
