'use client';

import { useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import type {
    EnrichedBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
} from '@/types';
import type { DbBreedingPair } from '@/types';
import type { DbBreedingLogEntry } from '@/types';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CreatureCard } from '@/components/custom-cards/creature-card';
import { Pagination } from '@/components/misc-custom-components/pagination';
import { Button } from '@/components/ui/button';
import { AddCreaturesDialog } from '@/components/custom-dialogs/add-creatures-dialog';
import { speciesList } from '@/constants/creature-data';

type CollectionClientProps = {
    initialCreatures: EnrichedCreature[];
    totalPages: number;
    allCreatures: EnrichedCreature[];
    allRawPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    allPairs: EnrichedBreedingPair[];
    allGoals: EnrichedResearchGoal[];
};

export function CollectionClient({
    initialCreatures,
    totalPages,
    allCreatures,
    allPairs,
    allRawPairs,
    allLogs,
    allGoals,
}: CollectionClientProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
    const handleOpenSyncDialog = (creature) => {
        setIsSyncDialogOpen(true);
    };
    const handleCloseDialog = () => {
        setIsSyncDialogOpen(false);
    };

    const handleFilterChange = useDebouncedCallback(
        (filterName: string, value: string | boolean) => {
            var params = new URLSearchParams();
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
                    onClick={() => handleOpenSyncDialog(null)}
                    className="text-xl mb-8 bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 drop-shadow-md drop-shadow-gray-500"
                >
                    + Add or Update Creatures
                </Button>
                <AddCreaturesDialog
                    isOpen={isSyncDialogOpen}
                    onClose={handleCloseDialog}
                />
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pompaca-purple dark:text-purple-400 h-4 w-4 z-10" />
                        <Input
                            placeholder="search for a creature..."
                            className="pl-10 bg-ebena-lavender dark:bg-midnight-purple border-pompaca-purple dark:border-purple-400 text-pompaca-purple dark:text-purple-300 focus-visible:ring-0 placeholder:text-dusk-purple dark:placeholder:text-purple-400 drop-shadow-sm drop-shadow-gray-500"
                            defaultValue={currentQuery}
                            onChange={(e) =>
                                handleFilterChange('query', e.target.value)
                            }
                        />
                    </div>

                    {/* Gender Filters */}
                    <Select
                        defaultValue={searchParams.get('gender') || 'all'}
                        onValueChange={(value) =>
                            handleFilterChange('gender', value)
                        }
                    >
                        <SelectTrigger className="w-32 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500">
                            <SelectValue placeholder="Filter by gender..." />
                        </SelectTrigger>
                        <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                            <SelectItem value="all">All Genders</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Stage Filter */}
                    <Select
                        value={currentStage}
                        onValueChange={(e) => handleFilterChange('stage', e)}
                    >
                        <SelectTrigger className="w-32 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500 focus-visible:ring-0">
                            <SelectValue placeholder="Filter by stage..." />
                        </SelectTrigger>
                        <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                            <SelectItem value="all">All Stages</SelectItem>
                            <SelectItem value="capsule">Capsule</SelectItem>
                            <SelectItem value="juvenile">Juvenile</SelectItem>
                            <SelectItem value="adult">Adult</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Species Filter */}
                    <Select
                        value={currentSpecies}
                        onValueChange={(value) =>
                            handleFilterChange('species', value)
                        }
                    >
                        <SelectTrigger className="w-48 bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400 drop-shadow-sm drop-shadow-gray-500 focus-visible:ring-0">
                            <SelectValue placeholder="Filter by species..." />
                        </SelectTrigger>
                        <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                            <SelectItem value="all">All Species</SelectItem>
                            {speciesList.map((species) => {
                                return (
                                    <SelectItem key={species} value={species}>
                                        {species}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
                {/* Creature Grid */}
                {initialCreatures.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {initialCreatures.map((creature) => {
                            return (
                                <CreatureCard
                                    key={creature?.id}
                                    creature={creature}
                                    allCreatures={allCreatures}
                                    allRawPairs={allRawPairs}
                                    allEnrichedPairs={allPairs}
                                    allLogs={allLogs}
                                    allGoals={allGoals}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50 rounded-lg">
                        <h2 className="text-2xl font-semibold text-pompaca-purple dark:text-purple-300">
                            No Creatures Found
                        </h2>
                        <p className="text-dusk-purple dark:text-purple-400 mt-2">
                            Try adjusting your filters or use the button above
                            to sync your collection.
                        </p>
                    </div>
                )}
                {/* Pagination */}
                <div className="flex justify-center">
                    <Pagination totalPages={totalPages} />
                </div>
            </div>
        </div>
    );
}
