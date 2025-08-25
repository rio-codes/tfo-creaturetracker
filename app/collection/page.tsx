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
    const currentPage = Number(searchParams?.page) || 1;
    const query = searchParams?.query;
    const stage = searchParams?.stage;
    const species = searchParams?.species;
    const gender = searchParams?.gender;

    const [
        { creatures: paginatedCreatures, totalPages },
        allCreatures,
        allPairs,
        allGoals,
    ] = await Promise.all([
        fetchFilteredCreatures(currentPage, query, gender, stage, species),
        getAllCreaturesForUser(),
        getAllBreedingPairsForUser(),
        getAllResearchGoalsForUser(),
    ]);

    return (
        <div className="bg-barely-lilac min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-pompaca-purple mb-8">
                    Collection
                </h1>
                <Suspense fallback={<div>Loading collection...</div>}>
                    {/* 3. Pass the data directly to the client component. */}
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
