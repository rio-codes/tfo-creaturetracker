'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import type { EnrichedBreedingPair, EnrichedCreature, EnrichedResearchGoal } from '@/types';
import { calculateGeneProbability } from '@/lib/genetics';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type PotentialPairPrediction = {
    maleParent: EnrichedCreature;
    femaleParent: EnrichedCreature;
    averageChance: number;
    isPossible: boolean;
    existingPairName?: string;
    existingPairId?: string;
};

type FindPotentialPairsDialogProps = {
    goal: EnrichedResearchGoal;
    allCreatures: EnrichedCreature[];
    allPairs: EnrichedBreedingPair[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLoadingChange: (loading: boolean) => void;
};

export function FindPotentialPairsDialog({
    goal,
    allCreatures,
    allPairs,
    open,
    onOpenChange,
    onLoadingChange,
}: FindPotentialPairsDialogProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [potentialPairPredictions, setPotentialPairPredictions] = useState<
        PotentialPairPrediction[]
    >([]);
    const [namingPair, setNamingPair] = useState<{
        male: EnrichedCreature;
        female: EnrichedCreature;
    } | null>(null);
    const [newPairName, setNewPairName] = useState('');

    const getMatchScoreStyle = (score: number): React.CSSProperties => {
        const hue = (score / 100) * 120; // 0 is red, 120 is green
        return { color: `hsl(${hue}, 90%, 40%)` };
    };

    useEffect(() => {
        if (!open) {
            setPotentialPairPredictions([]); // Clear on close
            onLoadingChange(false);
            return;
        }

        setIsLoading(true);

        // Use a timeout to allow the dialog to render before starting the heavy computation.
        const timer = setTimeout(() => {
            const existingPairsMap = new Map<string, { name: string; id: string }>();
            if (allPairs && Array.isArray(allPairs)) {
                for (const pair of allPairs) {
                    if (pair.maleParentId && pair.femaleParentId) {
                        const key = `${pair.maleParentId}-${pair.femaleParentId}`;
                        existingPairsMap.set(key, {
                            name: pair.pairName || 'Unnamed Pair',
                            id: pair.id,
                        });
                    }
                }
            }

            const males = allCreatures.filter((c) => c?.gender === 'male' && c?.growthLevel === 3);
            const females = allCreatures.filter(
                (c) => c?.gender === 'female' && c?.growthLevel === 3
            );

            const combinations: PotentialPairPrediction[] = [];

            for (const male of males) {
                for (const female of females) {
                    if (!male?.species || !female?.species) continue;
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
                        const pairKey = `${male.id}-${female.id}`;
                        const existingPair = existingPairsMap.get(pairKey);

                        combinations.push({
                            maleParent: male,
                            femaleParent: female,
                            averageChance: averageChance * 100,
                            isPossible: true,
                            existingPairName: existingPair?.name,
                            existingPairId: existingPair?.id,
                        });
                    }
                }
            }
            setPotentialPairPredictions(
                combinations.sort((a, b) => b.averageChance - a.averageChance)
            );
            setIsLoading(false);
            onLoadingChange(false);
        }, 50); // A small delay is enough for the UI to update.

        return () => clearTimeout(timer); // Cleanup the timer
    }, [open, goal, allCreatures, allPairs, onLoadingChange]);

    const handleCreateAndAssign = async (
        male: EnrichedCreature,
        female: EnrichedCreature,
        pairName: string
    ) => {
        const pairId = `${male?.id}-${female?.id}`;
        setIsCreating(pairId);
        try {
            const response = await fetch('/api/breeding-pairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maleParentId: male?.id,
                    femaleParentId: female?.id,
                    pairName,
                    assignedGoalIds: [goal.id],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create and assign pair.');
            }

            router.refresh();
            onOpenChange(false);
        } catch (error: any) {
            Sentry.captureException(error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsCreating(null);
            setNamingPair(null);
        }
    };

    const handleAssignExisting = async (pairId: string) => {
        setIsCreating(pairId);
        try {
            const response = await fetch(`/api/breeding-pairs/${pairId}/assign-goal`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goalId: goal.id, assign: true }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to assign pair.');
            }

            router.refresh();
            onOpenChange(false);
        } catch (error: any) {
            Sentry.captureException(error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsCreating(null);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl bg-ebena-lavender dark:bg-pompaca-purple">
                    <DialogHeader>
                        <DialogTitle>Find Potential Pairs for: {goal.name}</DialogTitle>
                        <DialogDescription>
                            Showing all possible pairs of adult creatures from your collection that
                            can produce a {goal.species} with the selected traits.
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
                                    ({
                                        maleParent,
                                        femaleParent,
                                        averageChance,
                                        existingPairName,
                                        existingPairId,
                                    }) => {
                                        const currentPairId =
                                            existingPairId ||
                                            `${maleParent?.id}-${femaleParent?.id}`;
                                        const isAssigned = goal.assignedPairIds?.includes(
                                            existingPairId!
                                        );
                                        return (
                                            <div
                                                key={currentPairId}
                                                className="flex items-center justify-between p-2 rounded-md bg-barely-lilac dark:bg-midnight-purple"
                                            >
                                                <div>
                                                    <p className="font-semibold">
                                                        {maleParent?.creatureName} (
                                                        {maleParent?.code}) x{' '}
                                                        {femaleParent?.creatureName} (
                                                        {femaleParent?.code})
                                                    </p>
                                                    {existingPairName && (
                                                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                                            Existing Pair: {existingPairName}
                                                        </p>
                                                    )}
                                                    <p className="text-sm">
                                                        Match Score:{' '}
                                                        <span
                                                            style={getMatchScoreStyle(
                                                                averageChance
                                                            )}
                                                            className="font-bold"
                                                        >
                                                            {averageChance.toFixed(2)}%
                                                        </span>
                                                    </p>
                                                </div>
                                                {existingPairId ? (
                                                    isAssigned ? (
                                                        <Button size="sm" disabled>
                                                            Already Assigned
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleAssignExisting(existingPairId)
                                                            }
                                                            disabled={isCreating === existingPairId}
                                                        >
                                                            {isCreating === existingPairId ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                'Assign Existing'
                                                            )}
                                                        </Button>
                                                    )
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setNamingPair({
                                                                male: maleParent,
                                                                female: femaleParent,
                                                            });
                                                            setNewPairName(
                                                                `${maleParent?.creatureName || maleParent?.code} & ${femaleParent?.creatureName || femaleParent?.code}`
                                                            );
                                                        }}
                                                        disabled={isCreating === currentPairId}
                                                    >
                                                        {isCreating === currentPairId ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            'Create & Assign'
                                                        )}
                                                    </Button>
                                                )}
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
            <AlertDialog open={!!namingPair} onOpenChange={(open) => !open && setNamingPair(null)}>
                <AlertDialogContent className="bg-barely-lilac dark:bg-pompaca-purple">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-pompaca-purple dark:text-purple-300">
                            Name New Pair
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-dusk-purple dark:text-purple-400">
                            Provide a name for this new breeding pair.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Label
                            htmlFor="pair-name"
                            className="text-pompaca-purple dark:text-purple-300"
                        >
                            Pair Name
                        </Label>
                        <Input
                            id="pair-name"
                            value={newPairName}
                            onChange={(e) => setNewPairName(e.target.value)}
                            placeholder="e.g., Main Cielarka Pair"
                            className="bg-ebena-lavender dark:bg-midnight-purple mt-1"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setNamingPair(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (namingPair) {
                                    handleCreateAndAssign(
                                        namingPair.male,
                                        namingPair.female,
                                        newPairName
                                    );
                                }
                            }}
                            disabled={isCreating !== null || !newPairName.trim()}
                        >
                            {isCreating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Save & Assign'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
