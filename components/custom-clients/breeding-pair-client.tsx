"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import type {
    EnrichedBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
} from "@/types";
import { BreedingPairCard } from "@/components/custom-cards/breeding-pair-card";
import { Pagination } from "@/components/misc-custom-components/pagination";
import { AddBreedingPairDialog } from "@/components/custom-dialogs/add-breeding-pair-dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type BreedingPairsClientProps = {
    initialPairs: EnrichedBreedingPair[];
    totalPages: number;
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    searchParams?: {
        page?: string;
        query?: string;
        species?: string;
    };
};

export function BreedingPairsClient({
    initialPairs,
    totalPages,
    allCreatures,
    allGoals,
    searchParams,
}: BreedingPairsClientProps) {
    const router = useRouter();
    const pathname = usePathname();

    const availableSpecies = useMemo(
        () => [...new Set(allCreatures.map((c) => c?.species).filter(Boolean))],
        [allCreatures]
    );

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleSpeciesFilter = (species: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        if (species && species !== "all") {
            params.set("species", species);
        } else {
            params.delete("species");
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="bg-barely-lilac min-h-screen">
            <div className="container mx-auto px-4 py-5">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-5xl font-bold text-pompaca-purple">
                        Breeding Pairs
                    </h1>
                    <AddBreedingPairDialog
                        allCreatures={allCreatures}
                        allGoals={allGoals}
                    />
                </div>
                {/* Search and Filter Controls */}
                <div className="flex gap-4 mb-8">
                    <Input
                        placeholder="Search by pair name, parent name, or code..."
                        defaultValue={searchParams?.query || ""}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="flex-grow bg-ebena-lavender"
                    />
                    <Select
                        onValueChange={handleSpeciesFilter}
                        defaultValue={searchParams?.species || "all"}
                    >
                        <SelectTrigger className="w-[200px] bg-ebena-lavender">
                            <SelectValue placeholder="Filter by species" />
                        </SelectTrigger>
                        <SelectContent className="bg-barely-lilac">
                            <SelectItem value="all">All Species</SelectItem>
                            {availableSpecies.map((species) => (
                                <SelectItem key={species} value={species!}>
                                    {species}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {/* Pairs Grid */}
                {initialPairs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {initialPairs.map((pair) => (
                            <BreedingPairCard
                                key={pair?.id}
                                pair={pair}
                                allCreatures={allCreatures}
                                allGoals={allGoals}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 bg-ebena-lavender/50 rounded-lg">
                        <h2 className="text-2xl font-semibold text-pompaca-purple">
                            No Breeding Pairs Found
                        </h2>
                        <p className="text-dusk-purple mt-2">
                            Try adjusting your search or filter, or click the "+
                            New Pair" button to get started.
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
