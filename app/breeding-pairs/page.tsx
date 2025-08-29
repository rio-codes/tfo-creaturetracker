import { fetchBreedingPairsWithStats } from "@/lib/data";
import { BreedingPairsClient } from "@/components/custom-clients/breeding-pair-client";
import { Suspense } from "react";
import {
    getAllCreaturesForUser,
    getAllResearchGoalsForUser,
    getAllRawBreedingPairsForUser,
    getAllBreedingLogEntriesForUser,
} from "@/lib/data";

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
    const [
        { pairs, totalPages },
        allCreatures,
        allGoals,
        allPairs,
        allLogs,
    ] = await Promise.all([
        fetchBreedingPairsWithStats(currentPage, query, species),
        getAllCreaturesForUser(),
        getAllResearchGoalsForUser(),
        getAllRawBreedingPairsForUser(),
        getAllBreedingLogEntriesForUser(),
    ]);

    return (
        <div className="bg-barely-lilac min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading pairs...</div>}>
                    <BreedingPairsClient
                        initialPairs={pairs}
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
