'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import type { EnrichedBreedingPair, EnrichedCreature, EnrichedResearchGoal } from '@/types';
import type { DbBreedingPair } from '@/types';
import type { DbBreedingLogEntry } from '@/types';
import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    KeyboardSensor as DndKitKeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import * as select from '@/components/ui/select';
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
import { speciesList } from '@/constants/creature-data';

type CollectionClientProps = {
    pinnedCreatures: EnrichedCreature[];
    unpinnedCreatures: EnrichedCreature[];
    totalPages: number;
    allCreatures: EnrichedCreature[];
    allRawPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    allPairs: EnrichedBreedingPair[];
    allGoals: EnrichedResearchGoal[];
};

// Custom Keyboard Sensor to ignore events from input fields
const CustomKeyboardSensor = (props: any) => {
    const sensor = useSensor(DndKitKeyboardSensor, {
        ...props,
        keyboardCodes: {
            start: ['Space', 'Enter'],
            cancel: ['Escape'],
            move: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
        },
        shouldHandleEvent: (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            return !(
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable
            );
        },
    });
    return sensor;
};

function SortableCreatureCard({
    creature,
    ...props
}: {
    creature: EnrichedCreature;
    allCreatures: EnrichedCreature[];
    allRawPairs: DbBreedingPair[];
    allEnrichedPairs: EnrichedBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    allGoals: EnrichedResearchGoal[];
}) {
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
            <CreatureCard
                creature={creature}
                allCreatures={props.allCreatures}
                allRawPairs={props.allRawPairs}
                allEnrichedPairs={props.allEnrichedPairs}
                allLogs={props.allLogs}
                allGoals={props.allGoals}
            />
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
    unpinnedCreatures,
    totalPages,
    allCreatures,
    allPairs,
    allRawPairs,
    allLogs,
    allGoals,
}: CollectionClientProps) {
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
        }),
        useSensor(CustomKeyboardSensor as any)
    );
    const [isMounted, setIsMounted] = useState(false);
    const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [pinnedCreatures, setPinnedCreatures] = useState(initialPinnedCreatures);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setPinnedCreatures(initialPinnedCreatures);
    }, [initialPinnedCreatures]);

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
            let params = new URLSearchParams();
            if (filterName == 'male' || filterName == 'female') {
                params = new URLSearchParams('genders');
            } else {
                params = new URLSearchParams(searchParams);
            }
            params.set('page', '1');

            if (value && value !== 'all') {
                params.set(filterName, String(value));
            } else {
                params.delete(filterName);
            }
            replace(`${pathname}?${params.toString()}`);
        },
        300
    ); // 300ms debounce delay

    const currentSpecies = searchParams.get('species') || 'all';
    const currentStage = searchParams.get('stage') || 'all';
    const currentQuery = searchParams.get('query') || '';

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
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pompaca-purple dark:text-purple-400 h-4 w-4 z-10" />
                        <Input
                            placeholder="search for a creature..."
                            className="pl-10 bg-ebena-lavender dark:bg-midnight-purple border-pompaca-purple dark:border-purple-400 text-pompaca-purple dark:text-purple-300 focus-visible:ring-0 placeholder:text-dusk-purple dark:placeholder:text-purple-400 drop-shadow-sm drop-shadow-gray-500"
                            defaultValue={currentQuery}
                            onChange={(e) => handleFilterChange('query', e.target.value)}
                        />
                    </div>

                    {/* Gender Filters */}
                    <select.Select
                        defaultValue={searchParams.get('gender') || 'all'}
                        onValueChange={(value) => handleFilterChange('gender', value)}
                    >
                        <select.SelectTrigger className="w-32 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500">
                            <select.SelectValue placeholder="Filter by gender..." />
                        </select.SelectTrigger>
                        <select.SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                            <select.SelectItem value="all">All Genders</select.SelectItem>
                            <select.SelectItem value="female">Female</select.SelectItem>
                            <select.SelectItem value="male">Male</select.SelectItem>
                        </select.SelectContent>
                    </select.Select>

                    {/* Stage Filter */}
                    <select.Select
                        value={currentStage}
                        onValueChange={(e) => handleFilterChange('stage', e)}
                    >
                        <select.SelectTrigger className="w-32 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500 focus-visible:ring-0">
                            <select.SelectValue placeholder="Filter by stage..." />
                        </select.SelectTrigger>
                        <select.SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                            <select.SelectItem value="all">All Stages</select.SelectItem>
                            <select.SelectItem value="capsule">Capsule</select.SelectItem>
                            <select.SelectItem value="juvenile">Juvenile</select.SelectItem>
                            <select.SelectItem value="adult">Adult</select.SelectItem>
                        </select.SelectContent>
                    </select.Select>

                    {/* Species Filter */}
                    <select.Select
                        value={currentSpecies}
                        onValueChange={(value) => handleFilterChange('species', value)}
                    >
                        <select.SelectTrigger className="w-48 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500 focus-visible:ring-0">
                            <select.SelectValue placeholder="Filter by species..." />
                        </select.SelectTrigger>
                        <select.SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                            <select.SelectItem value="all">All Species</select.SelectItem>
                            {speciesList.map((species) => {
                                return (
                                    <select.SelectItem key={species} value={species}>
                                        {species}
                                    </select.SelectItem>
                                );
                            })}
                        </select.SelectContent>
                    </select.Select>
                </div>
                {/* Pinned Creatures */}
                {pinnedCreatures.length > 0 && (
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 border-b-2 border-pompaca-purple/30 pb-2">
                                Pinned Creatures
                            </h2>
                            {isMounted && (
                                <Button
                                    onClick={() => setIsReorderDialogOpen(true)}
                                    className="md:hidden bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                                >
                                    Reorder
                                </Button>
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
                                                creature={creature}
                                                allCreatures={allCreatures}
                                                allRawPairs={allRawPairs}
                                                allEnrichedPairs={allPairs}
                                                allLogs={allLogs}
                                                allGoals={allGoals}
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
                                    allCreatures={allCreatures}
                                    allRawPairs={allRawPairs}
                                    allEnrichedPairs={allPairs}
                                    allLogs={allLogs}
                                    allGoals={allGoals}
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
                                    allCreatures={allCreatures}
                                    allRawPairs={allRawPairs}
                                    allEnrichedPairs={allPairs}
                                    allLogs={allLogs}
                                    allGoals={allGoals}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {pinnedCreatures.length === 0 && unpinnedCreatures.length === 0 ? (
                    <>
                        <div className="text-center py-16 px-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50 rounded-lg">
                            <h2 className="text-2xl font-semibold text-pompaca-purple dark:text-purple-300"></h2>
                            <p>Try adjusting your filters or use the button above</p> No Creatures
                            Found
                            <p className="text-dusk-purple dark:text-purple-400 mt-2">
                                Try adjusting your filters or use the button above to sync your
                                collection.
                            </p>
                        </div>
                    </>
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
