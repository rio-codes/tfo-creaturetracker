"use client";

import { useState } from "react";
import type { Creature, ResearchGoal } from "@/types";;
import { BreedingPairCard } from "@/components/breeding-pair-card";
import { Pagination } from "@/components/pagination";
import { AddBreedingPairDialog } from "@/components/add-breeding-pair-dialog"
import { BreedingPairWithDetails } from "@/types"

type BreedingPairsClientProps = {
    initialPairs: BreedingPairWithDetails[];
    totalPages: number;
    allCreatures: Creature[];
    allGoals: ResearchGoal[];
};

export function BreedingPairsClient({
    initialPairs,
    totalPages,
    allCreatures,
    allGoals
}: BreedingPairsClientProps) {
    const [isBreedingPairDialogOpen, setIsBreedingPairDialogOpen] = useState(false)

    return (
        <div className="bg-barely-lilac min-h-screen">
            <div className="container mx-auto px-4 py-5">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-5xl font-bold text-pompaca-purple">
                        Breeding Pairs
                    </h1>
                    <AddBreedingPairDialog
                        isOpen={isBreedingPairDialogOpen}
                        allCreatures={allCreatures}
                        allGoals={allGoals}
                    />
                </div>
                {/* Pairs Grid */}
                {initialPairs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {initialPairs.map((pair) => (
                            <BreedingPairCard key={pair.id} pair={pair} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 bg-ebena-lavender/50 rounded-lg">
                        <h2 className="text-2xl font-semibold text-pompaca-purple">
                            No Breeding Pairs Found
                        </h2>
                        <p className="text-dusk-purple mt-2">
                            Click the "+ New Pair" button to get started.
                        </p>
                    </div>
                )}
                <div className="mt-8 flex justify-center">
                    <Pagination totalPages={totalPages} />
                </div>
            </div>
        </div>
    );
}