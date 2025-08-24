import {
    fetchFilteredCreatures,
    getAllCreaturesForUser,
    getAllBreedingPairsForUser,
    getAllResearchGoalsForUser,
} from "@/lib/data";
import { CollectionClient } from "@/components/collection-client";
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
        allCreaturesData,
        allPairsData,
        allGoalsData,
    ] = await Promise.all([
        fetchFilteredCreatures(
            currentPage,
            query,
            gender,
            stage,
            species
        ),
        getAllCreaturesForUser(),
        getAllBreedingPairsForUser(),
        getAllResearchGoalsForUser(),
    ]);

    const serializableGoals = allGoalsData.map((goal) => ({
        ...goal,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
    }));


    const serializableCreatures = allCreaturesData.map((creature) => ({
        ...creature,
        createdAt: creature.createdAt.toISOString(),
        updatedAt: creature.updatedAt.toISOString(),
        gottenAt: creature.gottenAt ? creature.gottenAt.toISOString() : null,
    }));

    const serializablePairs = allPairsData.map((pair) => ({
        ...pair,
        createdAt: pair.createdAt.toISOString(),
        updatedAt: pair.updatedAt.toISOString(),
        maleParent: {
            ...pair.maleParent,
            createdAt: pair.maleParent.createdAt.toISOString(),
            updatedAt: pair.maleParent.updatedAt.toISOString(),
            gottenAt: pair.maleParent.gottenAt
                ? pair.maleParent.gottenAt.toISOString()
                : null,
        },
        femaleParent: {
            ...pair.femaleParent,
            createdAt: pair.femaleParent.createdAt.toISOString(),
            updatedAt: pair.femaleParent.updatedAt.toISOString(),
            gottenAt: pair.femaleParent.gottenAt
                ? pair.femaleParent.gottenAt.toISOString()
                : null,
        },
    }));

    return (
        <div className="bg-barely-lilac min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading collection...</div>}>
                    <CollectionClient
                        initialCreatures={paginatedCreatures}
                        totalPages={totalPages}
                        allCreatures={serializableCreatures}
                        allPairs={serializablePairs}
                        allGoals={serializableGoals} 
                    />
                </Suspense>
            </div>
        </div>
    );
}
