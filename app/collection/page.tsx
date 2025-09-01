import {
    fetchFilteredCreatures,
    getAllCreaturesForUser,
    getAllBreedingPairsForUser,
    getAllResearchGoalsForUser,
} from "@/lib/data";
import { CollectionClient } from "@/components/custom-clients/collection-client";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

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
        { creatures: paginatedCreatures, totalPages },
        allCreatures,
        allPairs,
        allGoals,
    ] = await Promise.all([
        fetchFilteredCreatures(searchParams),
        getAllCreaturesForUser(),
        getAllBreedingPairsForUser(),
        getAllResearchGoalsForUser(),
    ]);

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading collection...</div>}>
                    <CollectionClient
                        initialCreatures={paginatedCreatures}
                        totalPages={totalPages}
                        allCreatures={allCreatures}
                        allPairs={allPairs}
                        allGoals={allGoals}
                    />
                </Suspense>
            </div>
        </div>
    );
}
