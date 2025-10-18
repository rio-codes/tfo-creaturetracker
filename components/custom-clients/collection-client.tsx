'use client';

import React from 'react';
import { Switch } from '@mui/material';
import { Dna, Feather } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import type { EnrichedBreedingPair, EnrichedCreature, EnrichedResearchGoal, User } from '@/types';
import type { DbBreedingPair } from '@/types';
import type { DbBreedingLogEntry } from '@/types';
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

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import * as select from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CreatureCard } from '@/components/custom-cards/creature-card';
import { Pagination } from '@/components/misc-custom-components/pagination';
import { Button } from '@/components/ui/button';
import { AddCreaturesDialog } from '@/components/custom-dialogs/add-creatures-dialog';
import { structuredGeneData, AllSpeciesGeneData } from '@/constants/creature-data';

declare module '@mui/material/styles' {
    interface Palette {
        custom: Palette['primary'];
    }

    interface PaletteOptions {
        custom?: PaletteOptions['primary'];
    }
}

declare module '@mui/material/Switch' {
    interface SwitchPropsColorOverrides {
        custom: true;
    }
}

type CollectionClientProps = {
    pinnedCreatures: EnrichedCreature[];
    unpinnedCreatures: EnrichedCreature[];
    totalPages: number;
    allEnrichedCreatures: EnrichedCreature[];
    allRawPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    allEnrichedPairs: EnrichedBreedingPair[];
    allEnrichedGoals: EnrichedResearchGoal[];
    currentUser?: User | null;
    searchParams?: {
        generation?: string;
        origin?: string;
        geneCategory?: string;
        geneQuery?: string;
        page?: string;
        query?: string;
        stage?: string;
        gender?: string;
        species?: string;
        showArchived?: string;
        geneMode?: 'phenotype' | 'genotype';
    };
};

function SortableCreatureCard(props: {
    creature: EnrichedCreature;
    pinnedCreatures: EnrichedCreature[];
    unpinnedCreatures: EnrichedCreature[];
    totalPages: number;
    allCreatures: EnrichedCreature[];
    allRawPairs: DbBreedingPair[];
    allEnrichedPairs: EnrichedBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    allGoals: EnrichedResearchGoal[];
    currentUser?: User | null;
    _isAdminView?: boolean;
}) {
    const { creature, ...restProps } = props;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: creature!.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <CreatureCard creature={creature} {...restProps} />
        </div>
    );
}

function SortableCreatureImage({ creature }: { creature: EnrichedCreature }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: creature!.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        opacity: isDragging ? 0.8 : 1,
        cursor: 'grab',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="p-1 border rounded-md bg-ebena-lavender/50 dark:bg-midnight-purple/50 aspect-square flex items-center justify-center"
        >
            <img
                src={creature?.imageUrl || '/images/misc/placeholder.png'}
                alt={creature?.creatureName || creature?.code}
                className="w-full h-full object-contain"
            />
        </div>
    );
}

export function CollectionClient({
    pinnedCreatures: initialPinnedCreatures,
    unpinnedCreatures: initialUnpinnedCreatures,
    totalPages,
    allEnrichedCreatures: allCreatures,
    allRawPairs,
    allLogs,
    allEnrichedPairs: allPairs,
    allEnrichedGoals: allGoals,
    currentUser,
    searchParams: searchParamsFromProps, // Rename to avoid conflict
}: CollectionClientProps) {
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );
    const [isMounted, setIsMounted] = useState(false);
    const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
    const currentSearchParams = useSearchParams(); // Keep this for building new URLs
    const pathname = usePathname();
    const { replace } = useRouter();
    const [pinnedCreatures, setPinnedCreatures] = useState(initialPinnedCreatures || []);
    const [unpinnedCreatures, setUnpinnedCreatures] = useState(initialUnpinnedCreatures || []);
    const [geneMode, setGeneMode] = useState<'phenotype' | 'genotype'>(
        searchParamsFromProps?.geneMode || 'phenotype'
    );

    useEffect(() => {
        console.log('[CollectionClient] Component did mount.');
        setIsMounted(true);
    }, []);

    useEffect(() => {
        console.log('[CollectionClient] Props updated. Received:', {
            pinned: initialPinnedCreatures?.length,
            unpinned: initialUnpinnedCreatures?.length,
        });
        setPinnedCreatures(initialPinnedCreatures || []);
        setUnpinnedCreatures(initialUnpinnedCreatures || []);
    }, [initialPinnedCreatures, initialUnpinnedCreatures]);

    useEffect(() => {
        // This effect should only run once on mount to restore filters if the user
        // navigates to the page without any search params.
        const preserveFilters = localStorage.getItem('preserveFilters') === 'true';
        const hasSearchParams = currentSearchParams.toString().length > 0;

        if (preserveFilters && !hasSearchParams) {
            console.log('[CollectionClient] "Preserve Filters" is ON.');
            const savedFilters = localStorage.getItem('collectionFilters');
            if (savedFilters) {
                console.log(
                    '[CollectionClient] Found saved filters in localStorage, replacing URL:',
                    savedFilters
                );
                replace(`${pathname}?${savedFilters}`);
            }
        }
    }, []);

    const handleDragStart = (event: any) => {
        if (window.navigator.vibrate) {
            if (event.activatorEvent.type.startsWith('touch')) {
                window.navigator.vibrate(50); // A short, crisp vibration
            }
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event; // Ensure 'over' is not null
        if (over && active.id !== over.id) {
            const oldIndex = pinnedCreatures.findIndex((c) => c!.id === active.id);
            const newIndex = pinnedCreatures.findIndex((c) => c!.id === over.id);
            const newOrder = arrayMove(pinnedCreatures, oldIndex, newIndex);
            setPinnedCreatures(newOrder); // Optimistic update

            const orderedIds = newOrder.map((c) => c!.id);
            try {
                await fetch('/api/reorder-pinned', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'creature', orderedIds }),
                });
            } catch (error) {
                console.error('Failed to save new order', error);
                setPinnedCreatures(pinnedCreatures); // Revert on failure
            }
        }
    };

    const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
    const handleOpenSyncDialog = () => {
        setIsSyncDialogOpen(true);
    };
    const handleCloseDialog = () => {
        setIsSyncDialogOpen(false);
    };

    const handleFilterChange = useDebouncedCallback(
        (filterName: string, value: string | boolean) => {
            const params = new URLSearchParams(currentSearchParams);
            params.set('page', '1');
            const isCheckbox = typeof value === 'boolean';

            if (isCheckbox) {
                if (value) params.set(filterName, 'true');
                else params.delete(filterName);
            } else {
                if (value && value !== 'all') {
                    params.set(filterName, String(value));
                } else {
                    params.delete(filterName);
                }
            }

            const searchString = params.toString();
            const preserveFilters = localStorage.getItem('preserveFilters') === 'true';

            if (preserveFilters) {
                localStorage.setItem('collectionFilters', searchString);
            } else {
                localStorage.removeItem('collectionFilters');
            }

            console.log(
                '[CollectionClient] handleFilterChange is navigating to:',
                `${pathname}?${searchString}`
            );
            replace(`${pathname}?${searchString}`);
        },
        300
    );

    const handleClearFilters = () => {
        localStorage.removeItem('collectionFilters');
        replace(pathname);
    };

    const ownedSpecies = useMemo(() => {
        if (!allCreatures) return [];
        const speciesSet = new Set(allCreatures.map((c) => c?.species).filter(Boolean));
        return Array.from(speciesSet).sort() as string[];
    }, [allCreatures]);

    const geneCategories = useMemo(() => {
        const selectedSpecies = searchParamsFromProps?.species;
        if (!selectedSpecies || selectedSpecies === 'all') return [];
        return Object.keys(
            (structuredGeneData as AllSpeciesGeneData)[selectedSpecies] || {}
        ).filter((cat) => cat !== 'Gender');
    }, [searchParamsFromProps?.species]);

    const geneOptions = useMemo(() => {
        const selectedSpecies = searchParamsFromProps?.species;
        const selectedGeneCategory = searchParamsFromProps?.geneCategory;
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
    }, [searchParamsFromProps?.species, searchParamsFromProps?.geneCategory, geneMode]);

    const currentStage = searchParamsFromProps?.stage || 'all';
    const currentQuery = searchParamsFromProps?.query || '';
    const showArchived = searchParamsFromProps?.showArchived === 'true';
    const currentGeneration = searchParamsFromProps?.generation || '';
    const currentorigin = searchParamsFromProps?.origin || 'all';
    const origins = [
        'bred',
        'unknown',
        'cupboard',
        'genome-splicer',
        'another-lab',
        'quest',
        'raffle',
    ];

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-5">
                <h1 className="text-5xl font-bold text-pompaca-purple dark:text-purple-300 mb-5">
                    Collection
                </h1>
                <Button
                    onClick={() => handleOpenSyncDialog()}
                    className="text-xl mb-8 bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 drop-shadow-md drop-shadow-gray-500"
                >
                    + Add or Update Creatures
                </Button>
                <AddCreaturesDialog isOpen={isSyncDialogOpen} onClose={handleCloseDialog} />
                {/* Search and Filters */}
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Search Bar */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pompaca-purple dark:text-purple-400 h-4 w-4 z-10" />
                            <Input
                                placeholder="Search by name, code, species, origin, or genes..."
                                className="pl-10 bg-ebena-lavender dark:bg-midnight-purple border-pompaca-purple dark:border-purple-400 text-pompaca-purple dark:text-purple-300 focus-visible:ring-0 placeholder:text-dusk-purple dark:placeholder:text-purple-400 drop-shadow-sm drop-shadow-gray-500"
                                defaultValue={currentQuery}
                                onChange={(e) => handleFilterChange('query', e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleClearFilters}
                            variant="outline"
                            className="w-full md:w-auto bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500"
                        >
                            Clear Filters
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <select.Select
                            defaultValue={searchParamsFromProps?.gender || 'all'}
                            onValueChange={(value: string) => handleFilterChange('gender', value)}
                        >
                            <select.SelectTrigger className="w-full bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500">
                                <select.SelectValue placeholder="Gender" />
                            </select.SelectTrigger>
                            <select.SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                <select.SelectItem value="all">All Genders</select.SelectItem>
                                <select.SelectItem value="female">Female</select.SelectItem>
                                <select.SelectItem value="male">Male</select.SelectItem>
                            </select.SelectContent>
                        </select.Select>

                        <select.Select
                            value={currentStage}
                            onValueChange={(e: string) => handleFilterChange('stage', e)}
                        >
                            <select.SelectTrigger className="w-full bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500 focus-visible:ring-0">
                                <select.SelectValue placeholder="Stage" />
                            </select.SelectTrigger>
                            <select.SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                <select.SelectItem value="all">All Stages</select.SelectItem>
                                <select.SelectItem value="capsule">Capsule</select.SelectItem>
                                <select.SelectItem value="juvenile">Juvenile</select.SelectItem>
                                <select.SelectItem value="adult">Adult</select.SelectItem>
                            </select.SelectContent>
                        </select.Select>

                        <Input
                            min="1"
                            type="number"
                            placeholder="Generation"
                            className="bg-ebena-lavender dark:bg-midnight-purple border-pompaca-purple dark:border-purple-400 text-pompaca-purple dark:text-purple-300 focus-visible:ring-0 placeholder:text-dusk-purple dark:placeholder:text-purple-400 drop-shadow-sm drop-shadow-gray-500"
                            defaultValue={currentGeneration}
                            onChange={(e) => handleFilterChange('generation', e.target.value)}
                        />

                        <select.Select
                            value={currentorigin}
                            onValueChange={(value: string) => handleFilterChange('origin', value)}
                        >
                            <select.SelectTrigger className="w-full bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500 focus-visible:ring-0">
                                <select.SelectValue placeholder="Origin" />
                            </select.SelectTrigger>
                            <select.SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                <select.SelectItem value="all">All Origins</select.SelectItem>
                                {origins.map((origin) => (
                                    <select.SelectItem key={origin} value={origin}>
                                        {origin
                                            .replace(/-/g, ' ')
                                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </select.SelectItem>
                                ))}
                            </select.SelectContent>
                        </select.Select>

                        <select.Select
                            value={searchParamsFromProps?.species || 'all'}
                            onValueChange={(value: string) => {
                                const params = new URLSearchParams(currentSearchParams);
                                params.set('page', '1');
                                params.set('species', value);
                                params.delete('geneCategory');
                                params.delete('geneQuery');
                                replace(`${pathname}?${params.toString()}`);
                            }}
                        >
                            <select.SelectTrigger className="w-full bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500 focus-visible:ring-0">
                                <select.SelectValue placeholder="Species" />
                            </select.SelectTrigger>
                            <select.SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                <select.SelectItem value="all">All Species</select.SelectItem>
                                {ownedSpecies.map((s) => (
                                    <select.SelectItem key={s} value={s!}>
                                        {s}
                                    </select.SelectItem>
                                ))}
                            </select.SelectContent>
                        </select.Select>
                    </div>
                    {searchParamsFromProps?.species && searchParamsFromProps.species !== 'all' && (
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <select.Select
                                value={searchParamsFromProps?.geneCategory || 'any'}
                                onValueChange={(value: string) =>
                                    handleFilterChange('geneCategory', value)
                                }
                            >
                                <select.SelectTrigger className="flex-1 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 drop-shadow-sm drop-shadow-gray-500">
                                    <select.SelectValue placeholder="Filter by Genetic Trait" />
                                </select.SelectTrigger>
                                <select.SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                    <select.SelectItem value="any">Any Trait</select.SelectItem>
                                    {geneCategories.map((cat) => (
                                        <select.SelectItem key={cat} value={cat}>
                                            {cat}
                                        </select.SelectItem>
                                    ))}
                                </select.SelectContent>
                            </select.Select>

                            {searchParamsFromProps?.geneCategory && (
                                <>
                                    <select.Select
                                        value={searchParamsFromProps?.geneQuery || 'any'}
                                        onValueChange={(value: string) =>
                                            handleFilterChange('geneQuery', value)
                                        }
                                    >
                                        <select.SelectTrigger className="flex-1 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 drop-shadow-sm drop-shadow-gray-500">
                                            <select.SelectValue placeholder="Select Gene" />
                                        </select.SelectTrigger>
                                        <select.SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                            <select.SelectItem value="any">Any</select.SelectItem>
                                            {geneOptions.map((opt) => (
                                                <select.SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </select.SelectItem>
                                            ))}
                                        </select.SelectContent>
                                    </select.Select>
                                    <div className="flex items-center space-x-2">
                                        <Label
                                            htmlFor="gene-mode"
                                            className="text-pompaca-purple dark:text-barely-lilac"
                                        >
                                            <Feather className="h-4 w-4" />
                                        </Label>
                                        <Switch
                                            checked={geneMode === 'genotype'}
                                            onChange={(event, checked) => {
                                                const newMode = checked ? 'genotype' : 'phenotype';
                                                setGeneMode(newMode);
                                                handleFilterChange('geneMode', newMode);
                                            }}
                                            color="custom"
                                            size="medium"
                                        />
                                        <Label className="text-pompaca-purple dark:text-barely-lilac">
                                            <Dna className="h-4 w-4" />
                                        </Label>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2 mb-8">
                    <Checkbox
                        id="show-archived"
                        checked={showArchived}
                        onCheckedChange={(checked: boolean) =>
                            handleFilterChange('showArchived', !!checked)
                        }
                        className="border-pompaca-purple dark:border-purple-400 data-[state=checked]:bg-pompaca-purple data-[state=checked]:text-barely-lilac"
                    />
                    <Label
                        htmlFor="show-archived"
                        className="text-pompaca-purple dark:text-purple-300"
                    >
                        Show archived creatures
                    </Label>
                </div>
                {/* Pinned Creatures */}
                {pinnedCreatures.length > 0 && (
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 border-b-2 border-pompaca-purple/30 pb-2">
                                Pinned Creatures
                            </h2>
                            {isMounted && (
                                <>
                                    <Button
                                        onClick={() => setIsReorderDialogOpen(true)}
                                        className="md:hidden bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                                    >
                                        Reorder
                                    </Button>
                                    <p className="hidden md:block text-xs text-pompaca-purple dark:text-purple-400">
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
                                    items={pinnedCreatures.map((c) => c!.id)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pinnedCreatures.map((creature) => (
                                            <SortableCreatureCard
                                                key={creature!.id}
                                                pinnedCreatures={pinnedCreatures}
                                                unpinnedCreatures={unpinnedCreatures}
                                                totalPages={totalPages}
                                                creature={creature}
                                                allCreatures={allCreatures}
                                                allRawPairs={allRawPairs}
                                                allEnrichedPairs={allPairs}
                                                allLogs={allLogs}
                                                allGoals={allGoals}
                                                _isAdminView={false}
                                                currentUser={currentUser}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>

                        {/* Mobile: Static Grid */}
                        <div className="grid grid-cols-1 gap-6 md:hidden">
                            {pinnedCreatures.map((creature) => (
                                <CreatureCard
                                    key={creature!.id}
                                    creature={creature}
                                    currentUser={currentUser}
                                    isAdminView={false}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Unpinned Creatures */}
                {unpinnedCreatures.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 mb-4 border-b-2 border-pompaca-purple/30 pb-2">
                            All Creatures
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {unpinnedCreatures.map((creature) => (
                                <CreatureCard
                                    key={creature!.id}
                                    creature={creature}
                                    currentUser={currentUser}
                                    isAdminView={false}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {pinnedCreatures.length === 0 && unpinnedCreatures.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50 rounded-lg">
                        <h2 className="text-2xl font-semibold text-pompaca-purple dark:text-purple-300"></h2>
                        <p className="text-2xl font-semibold text-pompaca-purple dark:text-purple-300">
                            No Creatures Found
                        </p>
                        <p className="text-dusk-purple dark:text-purple-400 mt-2">
                            Try adjusting your filters or use the button above to sync your
                            collection.
                        </p>
                    </div>
                ) : null}
                {/* Pagination */}
                <div className="flex justify-center">
                    <Pagination totalPages={totalPages} />
                </div>

                {/* Reorder Dialog for Mobile */}
                <Dialog open={isReorderDialogOpen} onOpenChange={setIsReorderDialogOpen}>
                    <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple max-w-[95vw] sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Reorder Pinned Creatures</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[80vh] overflow-y-auto p-2">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={pinnedCreatures.map((c) => c!.id)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-4 gap-2">
                                        {pinnedCreatures.map((creature) => (
                                            <SortableCreatureImage
                                                key={creature!.id}
                                                creature={creature}
                                            />
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
    );
}
