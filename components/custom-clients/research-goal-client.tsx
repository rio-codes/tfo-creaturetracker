'use client';

import { useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import type { EnrichedResearchGoal } from '@/types';
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

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ResearchGoalCard } from '@/components/custom-cards/research-goal-card';
import { Pagination } from '@/components/misc-custom-components/pagination';
import { AddGoalDialog } from '@/components/custom-dialogs/add-goal-dialog';
import { speciesList } from '@/constants/creature-data';

type ResearchGoalClientProps = {
    pinnedGoals: EnrichedResearchGoal[];
    unpinnedGoals: EnrichedResearchGoal[];
    totalPages: number;
};

function SortableGoalCard({ goal }: { goal: EnrichedResearchGoal }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: goal.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <ResearchGoalCard goal={goal} />
        </div>
    );
}

export function ResearchGoalClient({
    pinnedGoals: initialPinnedGoals,
    unpinnedGoals,
    totalPages,
}: ResearchGoalClientProps) {
    const [pinnedGoals, setPinnedGoals] = useState(initialPinnedGoals);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = pinnedGoals.findIndex((g) => g.id === active.id);
            const newIndex = pinnedGoals.findIndex((g) => g.id === over.id);
            const newOrder = arrayMove(pinnedGoals, oldIndex, newIndex);
            setPinnedGoals(newOrder); // Optimistic update

            const orderedIds = newOrder.map((g) => g.id);
            try {
                await fetch('/api/reorder-pinned', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'research-goal', orderedIds }),
                });
            } catch (error) {
                console.error('Failed to save new order', error);
                setPinnedGoals(pinnedGoals); // Revert on failure
            }
        }
    };

    const handleFilterChange = useDebouncedCallback((filterName: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (value && value !== 'all') {
            params.set(filterName, value);
        } else {
            params.delete(filterName);
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-5">
                <h1 className="text-5xl font-bold text-pompaca-purple dark:text-purple-300 mb-8">
                    Research Goals
                </h1>
                <AddGoalDialog />

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pompaca-purple dark:text-purple-400 h-4 w-4 z-10" />
                        <Input
                            placeholder="search for a goal by name..."
                            className="pl-10 bg-ebena-lavender dark:bg-midnight-purple border-pompaca-purple dark:border-purple-400 text-pompaca-purple dark:text-purple-300 focus-visible:ring-0 placeholder:text-dusk-purple dark:placeholder:text-purple-400 drop-shadow-sm drop-shadow-gray-500"
                            defaultValue={searchParams.get('query') || ''}
                            onChange={(e) => handleFilterChange('query', e.target.value)}
                        />
                    </div>

                    {/* Species Filter */}
                    <Select
                        defaultValue={searchParams.get('species') || 'all'}
                        onValueChange={(value) => handleFilterChange('species', value)}
                    >
                        <SelectTrigger className="w-full md:w-48 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500 focus-visible:ring-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                            <SelectItem value="all">All Species</SelectItem>
                            {speciesList.map((species) => (
                                <SelectItem key={species} value={species}>
                                    {species}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Pinned Goals */}
                {pinnedGoals.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 mb-4 border-b-2 border-pompaca-purple/30 pb-2">
                            Pinned Goals
                        </h2>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={pinnedGoals.map((g) => g.id)}
                                strategy={rectSortingStrategy}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pinnedGoals.map((goal) => (
                                        <SortableGoalCard key={goal.id} goal={goal} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}

                {/* Unpinned Goals */}
                {unpinnedGoals.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 mb-4 border-b-2 border-pompaca-purple/30 pb-2">
                            All Goals
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {unpinnedGoals.map((goal) => (
                                <ResearchGoalCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                    </div>
                )}

                {pinnedGoals.length === 0 && unpinnedGoals.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50 rounded-lg">
                        <h2 className="text-2xl font-semibold text-pompaca-purple dark:text-purple-300">
                            No Goals Found
                        </h2>
                        <p className="text-dusk-purple dark:text-purple-400 mt-2">
                            Try adjusting your search or filter, or create a new goal.
                        </p>
                    </div>
                ) : null}

                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                    <Pagination totalPages={totalPages} />
                </div>
            </div>
        </div>
    );
}
