'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import type {
    EnrichedBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
    DbBreedingPair,
    DbBreedingLogEntry,
} from '@/types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BreedingPairCard } from '@/components/custom-cards/breeding-pair-card';
import { Pagination } from '@/components/misc-custom-components/pagination';
import { AddBreedingPairDialog } from '@/components/custom-dialogs/add-breeding-pair-dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { speciesList } from '@/constants/creature-data';
import { Search } from 'lucide-react';

type BreedingPairsClientProps = {
    pinnedPairs: EnrichedBreedingPair[];
    unpinnedPairs: EnrichedBreedingPair[];
    totalPages: number;
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    searchParams?: {
        page?: string;
        query?: string;
        species?: string;
    };
};

function SortablePairCard({
    pair,
    ...props
}: {
    pair: EnrichedBreedingPair;
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: pair.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <BreedingPairCard pair={pair} {...props} />
        </div>
    );
}

export function BreedingPairsClient({
    pinnedPairs: initialPinnedPairs,
    unpinnedPairs,
    totalPages,
    allCreatures,
    allGoals,
    allPairs,
    allLogs,
    searchParams,
}: BreedingPairsClientProps) {
    const [pinnedPairs, setPinnedPairs] = useState(initialPinnedPairs);
    const router = useRouter();
    const pathname = usePathname();
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = pinnedPairs.findIndex((p) => p.id === active.id);
            const newIndex = pinnedPairs.findIndex((p) => p.id === over.id);
            const newOrder = arrayMove(pinnedPairs, oldIndex, newIndex);
            setPinnedPairs(newOrder); // Optimistic update

            const orderedIds = newOrder.map((p) => p.id);
            try {
                await fetch('/api/reorder-pinned', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'breeding-pair', orderedIds }),
                });
            } catch (error) {
                console.error('Failed to save new order', error);
                setPinnedPairs(pinnedPairs); // Revert on failure
            }
        }
    };

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleSpeciesFilter = (species: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (species && species !== 'all') {
            params.set('species', species);
        } else {
            params.delete('species');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <TooltipProvider>
            <div className="min-h-screen">
                <div className="container mx-auto px-4 py-5">
                    <div className="flex-col justify-between items-center">
                        <h1 className="text-5xl font-bold text-pompaca-purple dark:text-purple-300 mb-5">
                            Breeding Pairs
                        </h1>
                        <AddBreedingPairDialog
                            allCreatures={allCreatures}
                            allGoals={allGoals}
                            allPairs={allPairs}
                            allLogs={allLogs}
                        />
                    </div>
                    {/* Search and Filter Controls */}
                    <div className="flex gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pompaca-purple dark:text-purple-400 h-4 w-4 z-10" />
                            <Input
                                placeholder="Search by pair name, parent name, or code..."
                                defaultValue={searchParams?.query || ''}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10 bg-ebena-lavender dark:bg-midnight-purple border-pompaca-purple dark:border-purple-400 text-pompaca-purple dark:text-purple-300 focus-visible:ring-0 placeholder:text-dusk-purple dark:placeholder:text-purple-400 drop-shadow-sm drop-shadow-gray-500"
                            />
                        </div>
                        <Select
                            onValueChange={handleSpeciesFilter}
                            defaultValue={searchParams?.species || 'all'}
                        >
                            <SelectTrigger className="w-[200px] bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 drop-shadow-sm drop-shadow-gray-500">
                                <SelectValue placeholder="Filter by species" />
                            </SelectTrigger>
                            <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                <SelectItem value="all">All Species</SelectItem>
                                {speciesList.map((species) => (
                                    <SelectItem key={species} value={species!}>
                                        {species}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Pinned Pairs */}
                    {pinnedPairs.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 mb-4 border-b-2 border-pompaca-purple/30 pb-2">
                                Pinned Pairs
                            </h2>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={pinnedPairs.map((p) => p.id)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pinnedPairs.map((pair) => (
                                            <SortablePairCard
                                                key={pair.id}
                                                pair={pair}
                                                allCreatures={allCreatures}
                                                allGoals={allGoals}
                                                allPairs={allPairs}
                                                allLogs={allLogs}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {/* Unpinned Pairs */}
                    {unpinnedPairs.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 mb-4 border-b-2 border-pompaca-purple/30 pb-2">
                                All Pairs
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {unpinnedPairs.map((pair) => (
                                    <BreedingPairCard
                                        key={pair.id}
                                        pair={pair}
                                        {...{ allCreatures, allGoals, allPairs, allLogs }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {pinnedPairs.length === 0 && unpinnedPairs.length === 0 ? (
                        <div className="text-center py-16 px-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50 rounded-lg">
                            <h2 className="text-2xl font-semibold text-pompaca-purple dark:text-purple-300">
                                No Breeding Pairs Found
                            </h2>
                            <p className="text-dusk-purple dark:text-purple-400 mt-2">
                                Try adjusting your search or filter, or click the "+ New Pair"
                                button to get started.
                            </p>
                        </div>
                    ) : null}

                    <div className="mt-8 flex justify-center">
                        <Pagination totalPages={totalPages} />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
