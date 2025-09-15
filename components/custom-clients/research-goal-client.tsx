'use client';

import { useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import type { EnrichedResearchGoal } from '@/types';

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
    initialGoals: EnrichedResearchGoal[];
    totalPages: number;
};

export function ResearchGoalClient({
    initialGoals: initialGoals,
    totalPages,
}: ResearchGoalClientProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

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

                {/* Goal Grid */}
                {initialGoals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {initialGoals.map((goal) => (
                            <ResearchGoalCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50 rounded-lg">
                        <h2 className="text-2xl font-semibold text-pompaca-purple dark:text-purple-300">
                            No Goals Found
                        </h2>
                        <p className="text-dusk-purple dark:text-purple-400 mt-2">
                            Try adjusting your search or filter, or create a new goal.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                    <Pagination totalPages={totalPages} />
                </div>
            </div>
        </div>
    );
}
