'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronUp, ChevronDown, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type {
    EnrichedBreedingPair,
    EnrichedResearchGoal,
    EnrichedCreature,
} from '@/types';
import { ManageBreedingPairsDialog } from '../custom-dialogs/manage-breeding-pairs-dialog';
import { structuredGeneData } from '@/lib/creature-data';

interface CreatureCardProps {
    creature: EnrichedCreature;
    allCreatures: EnrichedCreature[];
    allPairs: EnrichedBreedingPair[];
    allGoals: EnrichedResearchGoal[];
    isAdminView?: boolean;
}

export function CreatureCard({
    creature,
    allCreatures,
    allPairs,
    allGoals,
    isAdminView = false,
}: CreatureCardProps) {
    const router = useRouter();
    const [isPinned, setIsPinned] = useState(creature!.isPinned);
    const [isPinning, setIsPinning] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePinToggle = async () => {
        setIsPinning(true);
        const newPinState = !isPinned;
        try {
            const response = await fetch(`/api/creatures/${creature!.id}/pin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: newPinState }),
            });
            if (!response.ok) {
                throw new Error('Failed to update pin status.');
            }
            setIsPinned(newPinState);
            router.refresh(); // Re-fetch data to re-sort the grid
        } catch (error) {
            console.error(error);
            alert('Could not update pin status. Please try again.');
        } finally {
            setIsPinning(false);
        }
    };

    const handleRemoveFromCollection = async () => {
        if (
            !window.confirm(
                `Are you sure you want to remove "${
                    creature!.creatureName || creature!.code
                }" from your collection? This cannot be undone.`
            )
        ) {
            return;
        }
        setIsDeleting(true);
        try {
            const apiUrl = isAdminView
                ? `/api/admin/creatures/${creature!.id}`
                : `/api/creatures/${creature!.id}`;

            const response = await fetch(apiUrl, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to remove the creature.');
            }
            // Reload the page to ensure the underlying admin table is updated.
            window.location.reload();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 border-border overflow-hidden overscroll-y-contain drop-shadow-md drop-shadow-gray-500">
            <div className="absolute top-1 right-1 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePinToggle}
                    disabled={isPinning}
                    aria-label={isPinned ? 'Unpin goal' : 'Pin goal'}
                    className="h-8 w-8 rounded-full hover:bg-pompaca-purple/20"
                >
                    {isPinned ? (
                        <Pin className="h-5 w-5 text-pompaca-purple dark:text-purple-300 fill-pompaca-purple dark:fill-purple-300" />
                    ) : (
                        <PinOff className="h-5 w-5 text-dusk-purple dark:text-purple-400" />
                    )}
                </Button>
            </div>
            <CardContent className="p-4">
                {/* Creature Image */}
                <div className="rounded-lg p-4 mb-4 flex justify-center">
                    <img
                        src={creature!.imageUrl || '/placeholder.png'}
                        alt={creature!.code + ', ' + creature!.species}
                        className="w-35 h-35 object-scale-down"
                    />
                </div>
                <div className="text-smspace-y-1 h-30">
                    <div>
                        <strong>Name:</strong> {creature!.creatureName}
                    </div>
                    <div>
                        <strong>Code:</strong> {creature!.code}
                    </div>
                    <div>
                        <strong>Species:</strong> {creature!.species}
                    </div>
                    <div>
                        <strong>Gender:</strong> {creature!.gender}
                    </div>
                </div>
                <div className="h-5">
                    <strong>Genotype:</strong>
                </div>
                <ScrollArea className="h-32 mb-4 relative rounded-md border border-pompaca-purple/30 p-4 bg-ebena-lavender/20 dark:bg-midnight-purple/50">
                    <div className="text-sm space-y-1 ">
                        <div className="whitespace-pre-line pr-4">
                            {creature!.geneData ? (
                                <div className="pl-2 text-dusk-purple dark:text-purple-400 text-xs font-mono mt-1 space-y-1">
                                    {creature!.geneData.map((gene) => (
                                        <div key={gene!.category}>
                                            <span className="font-bold text-pompaca-purple dark:text-purple-300">
                                                {gene!.category}:
                                            </span>
                                            <div className="pl-2">
                                                <div>
                                                    Phenotype: {gene!.phenotype}
                                                </div>
                                                <div>
                                                    Genotype: {gene!.genotype}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Unknown</p>
                            )}
                        </div>
                    </div>
                    <ScrollBar orientation="vertical" />
                    <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple">
                        <ChevronUp className=" h-4 w-4 text-barely-lilac" />
                        <ChevronDown className="h-4 w-4 text-barely-lilac" />
                    </div>
                </ScrollArea>

                {/* Buttons */}
                <div className="flex w-full gap-2 justify-center text-sm">
                    <ManageBreedingPairsDialog
                        baseCreature={creature}
                        allCreatures={allCreatures}
                        allPairs={allPairs}
                        allGoals={allGoals}
                    >
                        <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 w-30 h-16">
                            <span className="text-wrap wrap-normal text-sm/tight">
                                Manage Breeding Pairs
                            </span>
                        </Button>
                    </ManageBreedingPairsDialog>
                    <Button
                        onClick={handleRemoveFromCollection}
                        className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 w-30 h-16"
                    >
                        {isDeleting ? (
                            <span className="text-wrap wrap-normal gap-y-1 text-sm/tight">
                                "Removing..."
                            </span>
                        ) : (
                            <span className="text-wrap wrap-normal gap-y-1 text-sm/tight">
                                Remove from Collection
                            </span>
                        )}
                    </Button>
                </div>
                <div className="flex w-full justify-center">
                    <Link
                        href={`https://finaloutpost.net/view/${creature!.code}`}
                    >
                        <span className="mt-3 text-md font-semibold text-dusk-purple dark:text-purple-400 text-center py-5">
                            View on TFO
                        </span>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
