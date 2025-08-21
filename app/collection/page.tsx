import { getCreaturesForUser, getAllBreedingPairsForUser } from "@/lib/data";
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

    const { creatures, totalPages } = await getCreaturesForUser(
        currentPage,
        query,
        gender,
        stage,
        species
    );

    const allPairsData = await getAllBreedingPairsForUser();
    const serializablePairs = allPairsData.map((pair) => ({
        ...pair,
        // Serialize dates on the top-level pair object
        createdAt: pair.createdAt.toISOString(),
        updatedAt: pair.updatedAt.toISOString(),

        // Serialize dates within the nested maleParent object
        maleParent: {
            ...pair.maleParent,
            createdAt: pair.maleParent.createdAt.toISOString(),
            updatedAt: pair.maleParent.updatedAt.toISOString(),
            gottenAt: pair.maleParent.gottenAt
                ? pair.maleParent.gottenAt.toISOString()
                : null,
        },

        // Serialize dates within the nested femaleParent object
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
                        initialCreatures={creatures}
                        totalPages={totalPages}
                        allPairs={serializablePairs}
                    />
                </Suspense>
            </div>
        </div>
    );
}
