'use client';

import React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
    MouseSensor,
    TouchSensor,
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { speciesList, structuredGeneData, AllSpeciesGeneData } from '@/constants/creature-data';
import { Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

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
        geneCategory?: string;
        geneQuery?: string;
        geneMode?: 'phenotype' | 'genotype';
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
        zIndex: isDragging ? 20 : undefined,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <BreedingPairCard pair={pair} {...props} />
        </div>
    );
}

function SortablePairImage({ pair }: { pair: EnrichedBreedingPair }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: pair.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        opacity: isDragging ? 0.8 : 1,
        cursor: 'grab',
    };

    const getCacheBustedImageUrl = (creature: EnrichedCreature | null | undefined) => {
        if (!creature?.imageUrl) return '';
        if (creature.updatedAt)
            return `${creature.imageUrl}?v=${new Date(creature.updatedAt).getTime()}`;
        return creature.imageUrl;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="p-1 border rounded-md bg-ebena-lavender/50 dark:bg-midnight-purple/50 aspect-video flex items-center justify-center"
        >
            <div className="flex items-center gap-1">
                <img
                    src={getCacheBustedImageUrl(pair.maleParent)}
                    alt={pair.maleParent!.code}
                    className="w-1/2 object-contain bg-blue-100 p-0.5 border border-pompaca-purple rounded-md"
                />
                <img
                    src={getCacheBustedImageUrl(pair.femaleParent)}
                    alt={pair.femaleParent!.code}
                    className="w-1/2 object-contain bg-pink-100 p-0.5 border border-pompaca-purple rounded-md"
                />
            </div>
        </div>
    );
}

export function BreedingPairsClient({
    pinnedPairs: initialPinnedPairs,
    unpinnedPairs: initialUnpinnedPairs,
    totalPages,
    allCreatures,
    allGoals,
    allPairs,
    allLogs,
    searchParams,
}: BreedingPairsClientProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [unpinnedPairs, setUnpinnedPairs] = useState(initialUnpinnedPairs);
    const [pinnedPairs, setPinnedPairs] = useState(initialPinnedPairs);
    const sensors = useSensors(
        useSensor(MouseSensor, {
            // Require the mouse to move by 5 pixels before activating
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            // Press and hold for 250ms for touch devices
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );
    const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const [selectedSpecies, setSelectedSpecies] = useState(searchParams?.species || 'all');
    const [selectedGeneCategory, setSelectedGeneCategory] = useState(
        searchParams?.geneCategory || ''
    );
    const [geneMode, setGeneMode] = useState<'phenotype' | 'genotype'>(
        searchParams?.geneMode || 'phenotype'
    );

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setPinnedPairs(initialPinnedPairs);
        setUnpinnedPairs(initialUnpinnedPairs);
    }, [initialPinnedPairs, initialUnpinnedPairs]);

    useEffect(() => {
        const preserveFilters = localStorage.getItem('preserveFilters') === 'true';
        if (preserveFilters) {
            const savedFilters = localStorage.getItem('breedingPairsFilters');
            if (savedFilters) {
                router.replace(`${pathname}?${savedFilters}`);
            }
        }
    }, [pathname, router]);

    const handleFilterChange = useDebouncedCallback((newParams: URLSearchParams) => {
        const preserveFilters = localStorage.getItem('preserveFilters') === 'true';
        const searchString = newParams.toString();

        if (preserveFilters) {
            localStorage.setItem('breedingPairsFilters', searchString);
        } else {
            localStorage.removeItem('breedingPairsFilters');
        }
        router.replace(`${pathname}?${searchString}`);
    }, 300);

    const handleDragStart = (event: any) => {
        // Provide haptic feedback on mobile devices when a drag starts.
        if (window.navigator.vibrate) {
            // The `activatorEvent` tells us what originally triggered the drag.
            // We only want to vibrate for touch events.
            if (event.activatorEvent.type.startsWith('touch')) {
                window.navigator.vibrate(50); // A short, crisp vibration
            }
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
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

    const updateSearchParam = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        if (key === 'species' && (!value || value === 'all')) {
            params.delete('geneCategory');
            params.delete('geneQuery');
        }
        if (key === 'geneCategory' && !value) {
            params.delete('geneQuery');
        }

        handleFilterChange(params);
    };

    const geneCategories = useMemo(() => {
        if (!selectedSpecies || selectedSpecies === 'all') return [];
        return Object.keys(
            (structuredGeneData as AllSpeciesGeneData)[selectedSpecies] || {}
        ).filter((cat) => cat !== 'Gender');
    }, [selectedSpecies]);

    const geneOptions = useMemo(() => {
        if (!selectedSpecies || selectedSpecies === 'all' || !selectedGeneCategory) return [];

        const categoryData = (structuredGeneData as AllSpeciesGeneData)[selectedSpecies]?.[
            selectedGeneCategory
        ];
        if (!categoryData) return [];

        if (geneMode === 'phenotype') {
            const phenotypes = new Set(categoryData.map((g) => g.phenotype));
            return Array.from(phenotypes).map((p) => ({
                value: p,
                label: p,
            }));
        } else {
            // genotype mode
            return categoryData.map((g) => ({
                value: g.genotype,
                label: `${g.phenotype} (${g.genotype})`,
            }));
        }
    }, [selectedSpecies, selectedGeneCategory, geneMode]);

    const handleSpeciesChange = (value: string) => {
        setSelectedSpecies(value);
        setSelectedGeneCategory('');
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (value && value !== 'all') {
            params.set('species', value);
        } else {
            params.delete('species');
        }
        params.delete('geneCategory');
        params.delete('geneQuery');
        handleFilterChange(params);
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
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pompaca-purple dark:text-purple-400 h-4 w-4 z-10" />
                                <Input
                                    placeholder="Search by pair name, parent name/code, or genes..."
                                    defaultValue={searchParams?.query || ''}
                                    onChange={(e) => updateSearchParam('query', e.target.value)}
                                    className="pl-10 bg-ebena-lavender dark:bg-midnight-purple border-pompaca-purple dark:border-purple-400 text-pompaca-purple dark:text-purple-300 focus-visible:ring-0 placeholder:text-dusk-purple dark:placeholder:text-purple-400 drop-shadow-sm drop-shadow-gray-500"
                                />
                            </div>
                            <Select onValueChange={handleSpeciesChange} value={selectedSpecies}>
                                <SelectTrigger className="w-[200px] bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 drop-shadow-sm drop-shadow-gray-500">
                                    <SelectValue placeholder="Filter by species" />
                                </SelectTrigger>
                                <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                    <SelectItem value="all">All Species</SelectItem>
                                    {speciesList.map((s) => (
                                        <SelectItem key={s} value={s!}>
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedSpecies && selectedSpecies !== 'all' && (
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <Select
                                    value={selectedGeneCategory}
                                    onValueChange={(value) => {
                                        setSelectedGeneCategory(value);
                                        updateSearchParam('geneCategory', value);
                                    }}
                                >
                                    <SelectTrigger className="flex-1 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 drop-shadow-sm drop-shadow-gray-500">
                                        <SelectValue placeholder="Filter by Gene Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                        <SelectItem value="">Any Category</SelectItem>
                                        {geneCategories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedGeneCategory && (
                                    <>
                                        <Select
                                            value={searchParams?.geneQuery || ''}
                                            onValueChange={(value) =>
                                                updateSearchParam('geneQuery', value)
                                            }
                                        >
                                            <SelectTrigger className="flex-1 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 drop-shadow-sm drop-shadow-gray-500">
                                                <SelectValue placeholder="Select Gene" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                                <SelectItem value="">Any</SelectItem>
                                                {geneOptions.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm">Pheno</span>
                                            <Switch
                                                checked={geneMode === 'genotype'}
                                                onCheckedChange={(checked) => {
                                                    const newMode = checked
                                                        ? 'genotype'
                                                        : 'phenotype';
                                                    setGeneMode(newMode);
                                                    updateSearchParam('geneMode', newMode);
                                                }}
                                            />
                                            <span className="text-sm">Geno</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pinned Pairs */}
                    {pinnedPairs.length > 0 && (
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 border-b-2 border-pompaca-purple/30 pb-2">
                                    Pinned Pairs
                                </h2>
                                {isMounted && (
                                    <>
                                        <Button
                                            onClick={() => setIsReorderDialogOpen(true)}
                                            className="md:hidden bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                                        >
                                            Reorder
                                        </Button>
                                        <p className="hidden md:block text-xs text-dusk-purple dark:text-purple-400">
                                            (Drag and drop to rearrange pinned cards)
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Desktop: Draggable Grid */}
                            <div className="hidden md:block">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={pinnedPairs.map((p) => p.id)}
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {pinnedPairs?.map((pair) => (
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

                            {/* Mobile: Static Grid */}
                            <div className="grid grid-cols-1 gap-6 md:hidden">
                                {pinnedPairs?.map((pair) => (
                                    <BreedingPairCard
                                        key={pair.id}
                                        pair={pair}
                                        allCreatures={allCreatures}
                                        allGoals={allGoals}
                                        allPairs={allPairs}
                                        allLogs={allLogs}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Unpinned Pairs */}
                    {unpinnedPairs.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 mb-4 border-b-2 border-pompaca-purple/30 pb-2">
                                All Pairs
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {unpinnedPairs?.map((pair) => (
                                    <BreedingPairCard
                                        key={pair.id}
                                        pair={pair}
                                        {...{ allCreatures, allGoals, allPairs, allLogs }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {pinnedPairs?.length === 0 && unpinnedPairs?.length === 0 ? (
                        <div className="text-center py-16 px-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50 rounded-lg">
                            <h2 className="text-2xl font-semibold text-pompaca-purple dark:text-purple-300">
                                No Breeding Pairs Found
                            </h2>
                            <p className="text-dusk-purple dark:text-purple-400 mt-2">
                                Try adjusting your search or filter, or click the &#34;+ New
                                Pair&#34; button to get started.
                            </p>
                        </div>
                    ) : null}

                    <div className="mt-8 flex justify-center">
                        <Pagination totalPages={totalPages} />
                    </div>

                    {/* Reorder Dialog for Mobile */}
                    <Dialog open={isReorderDialogOpen} onOpenChange={setIsReorderDialogOpen}>
                        <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple max-w-[95vw] sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Reorder Pinned Pairs</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[80vh] overflow-y-auto p-2">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={pinnedPairs?.map((p) => p.id)}
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="grid grid-cols-2 gap-2">
                                            {pinnedPairs?.map((pair) => (
                                                <SortablePairImage key={pair.id} pair={pair} />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                            <DialogFooter className="pt-4 sm:justify-center">
                                <Button
                                    onClick={() => setIsReorderDialogOpen(false)}
                                    className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                                >
                                    Done
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </TooltipProvider>
    );
}
