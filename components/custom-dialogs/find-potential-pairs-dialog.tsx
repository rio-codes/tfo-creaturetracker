'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import type { EnrichedCreature, EnrichedResearchGoal } from '@/types';
import { calculateGeneProbability } from '@/lib/genetics';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules';

type PotentialPairPrediction = {
    maleParent: EnrichedCreature;
    femaleParent: EnrichedCreature;
    averageChance: number;
    isPossible: boolean;
};

type FindPotentialPairsDialogProps = {
    goal: EnrichedResearchGoal;
    allCreatures: EnrichedCreature[];
    children: React.ReactNode;
};

export function FindPotentialPairsDialog({
    goal,
    allCreatures,
    children,
}: FindPotentialPairsDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isCreating, setIsCreating] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [potentialPairPredictions, setPotentialPairPredictions] = useState<
        PotentialPairPrediction[]
    >([]);

    useEffect(() => {
        if (!open) {
            setPotentialPairPredictions([]); // Clear on close
            return;
        }

        setIsLoading(true);

        // Use a timeout to allow the dialog to render before starting the heavy computation.
        const timer = setTimeout(() => {
            const males = allCreatures.filter((c) => c.gender === 'Male' && c.growthLevel === 3);
            const females = allCreatures.filter(
                (c) => c.gender === 'Female' && c.growthLevel === 3
            );

            const combinations: PotentialPairPrediction[] = [];

            for (const male of males) {
                for (const female of females) {
                    if (!male.species || !female.species) continue;

                    const possibleOffspring = getPossibleOffspringSpecies(
                        male.species,
                        female.species
                    );

                    if (!possibleOffspring.includes(goal.species)) {
                        continue;
                    }

                    let totalChance = 0;
                    let geneCount = 0;
                    let isPossible = true;

                    for (const [category, targetGeneInfo] of Object.entries(goal.genes)) {
                        if (!targetGeneInfo.isOptional) {
                            const chance = calculateGeneProbability(
                                male,
                                female,
                                category,
                                targetGeneInfo,
                                goal.goalMode
                            );
                            if (chance === 0) {
                                isPossible = false;
                                break; // No need to check other genes if one makes it impossible
                            }
                            totalChance += chance;
                            geneCount++;
                        }
                    }

                    if (isPossible) {
                        const averageChance = geneCount > 0 ? totalChance / geneCount : 1;
                        combinations.push({
                            maleParent: male,
                            femaleParent: female,
                            averageChance: averageChance * 100,
                            isPossible: true,
                        });
                    }
                }
            }

            setPotentialPairPredictions(
                combinations.sort((a, b) => b.averageChance - a.averageChance)
            );
            setIsLoading(false);
        }, 100); // Small delay to show loading spinner

        return () => clearTimeout(timer);
    }, [open, goal, allCreatures]);

    const handleCreateAndAssign = async (male: EnrichedCreature, female: EnrichedCreature) => {
        const pairId = `${male.id}-${female.id}`;
        setIsCreating(pairId);
        try {
            const response = await fetch('/api/breeding-pairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maleParentId: male.id,
                    femaleParentId: female.id,
                    pairName: `${male.creatureName || male.code} & ${female.creatureName || female.code}`,
                    assignedGoalIds: [goal.id],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create and assign pair.');
            }

            router.refresh();
            setOpen(false);
        } catch (error: any) {
            Sentry.captureException(error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsCreating(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl bg-ebena-lavender dark:bg-pompaca-purple">
                <DialogHeader>
                    <DialogTitle>Find Potential Pairs for: {goal.name}</DialogTitle>
                    <DialogDescription>
                        Showing all possible pairs of adult creatures from your collection that can
                        produce a {goal.species}.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p className="ml-4">Searching for pairs...</p>
                            </div>
                        ) : potentialPairPredictions.length > 0 ? (
                            potentialPairPredictions.map(
                                ({ maleParent, femaleParent, averageChance }) => {
                                    const currentPairId = `${maleParent.id}-${femaleParent.id}`;
                                    return (
                                        <div
                                            key={currentPairId}
                                            className="flex items-center justify-between p-2 rounded-md bg-barely-lilac dark:bg-midnight-purple"
                                        >
                                            <div>
                                                <p className="font-semibold">
                                                    {maleParent.creatureName || maleParent.code} &{' '}
                                                    {femaleParent.creatureName || femaleParent.code}
                                                </p>
                                                <p className="text-sm text-dusk-purple dark:text-purple-400">
                                                    Match Score: {averageChance.toFixed(2)}%
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleCreateAndAssign(maleParent, femaleParent)
                                                }
                                                disabled={isCreating === currentPairId}
                                            >
                                                {isCreating === currentPairId ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    'Create & Assign'
                                                )}
                                            </Button>
                                        </div>
                                    );
                                }
                            )
                        ) : (
                            <p className="text-center italic py-8">
                                No possible pairs found for this goal in your collection.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
