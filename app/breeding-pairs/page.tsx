import { fetchBreedingPairs } from "@/lib/data";
import { BreedingPairsClient } from "@/components/breeding-pair-client";
import { Suspense } from "react";
import { getAllCreaturesForUser, getAllResearchGoalsForUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BreedingPairsPage({
    searchParams,
}: {
    searchParams?: { page?: string };
}) {
    const currentPage = Number(searchParams?.page) || 1;
    const { pairs, totalPages } = await fetchBreedingPairs(currentPage);
    console.log(pairs)

    const allCreatures = await getAllCreaturesForUser();
    const allGoals = await getAllResearchGoalsForUser();

    const serializableCreatures = allCreatures.map((creature) => ({
        ...creature,
        gottenAt: creature.gottenAt ? creature.gottenAt.toISOString() : null,
        createdAt: creature.createdAt.toISOString(),
        updatedAt: creature.updatedAt.toISOString(),
    }));

    const serializableGoals = allGoals.map((goal) => ({
        ...goal,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
    }));
    
    return (
        <div className="bg-barely-lilac min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading pairs...</div>}>
                    <BreedingPairsClient
                        initialPairs={pairs}
                        totalPages={totalPages}
                        allCreatures={serializableCreatures}
                        allGoals={serializableGoals}
                    />
                </Suspense>
            </div>
        </div>
    );
}
