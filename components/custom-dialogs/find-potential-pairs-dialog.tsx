'use client';

import React from 'react';
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
import { Loader2, Network } from 'lucide-react';
import type { EnrichedCreature, EnrichedResearchGoal } from '@/types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type PotentialPairPrediction = {
    maleParent: EnrichedCreature;
    femaleParent: EnrichedCreature;
    averageChance: number;
    isPossible: boolean;
    isInbred: boolean;
    existingPairName?: string;
    existingPairId?: string;
};

type FindPotentialPairsDialogProps = {
    goal: EnrichedResearchGoal;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLoadingChange: (loading: boolean) => void;
};

export function FindPotentialPairsDialog({
    goal,
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
        const hue = (score / 100) * 120;
        return { color: `hsl(${hue}, 90%, 40%)` };
    };

    useEffect(() => {
        if (!open) {
            setPotentialPairPredictions([]);
            onLoadingChange(false);
            return;
        }

        const findPairs = async () => {
            setIsLoading(true);
            onLoadingChange(true);
            try {
                const response = await fetch(`/api/research-goals/${goal.id}/find-potential-pairs`);
                if (!response.ok) {
                    throw new Error('Failed to find potential pairs.');
                }
                const data = await response.json();
                setPotentialPairPredictions(data);
            } catch (error) {
                console.error(error);
                // Optionally set an error state to show in the UI
            } finally {
                setIsLoading(false);
                onLoadingChange(false);
            }
        };

        findPairs();
    }, [open, goal.id, onLoadingChange]);

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
                    species: male?.species || female?.species,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create and assign pair.');
            }
            router.refresh();
            onOpenChange(false);
        } catch (error: any) {
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
            alert(`Error: ${error.message}`);
        } finally {
            setIsCreating(null);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet">
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
                                        isInbred,
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
                                                className="flex items-center justify-between p-2 rounded-md bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss"
                                            >
                                                <div>
                                                    <p className="font-semibold">
                                                        {maleParent?.creatureName} (
                                                        {maleParent?.code}) (G
                                                        {maleParent?.generation})x{' '}
                                                        {femaleParent?.creatureName} (
                                                        {femaleParent?.code}) (G
                                                        {femaleParent?.generation})
                                                    </p>
                                                    {existingPairName && (
                                                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                                            Existing Pair: {existingPairName}
                                                        </p>
                                                    )}
                                                    {isInbred && (
                                                        <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                                                            <Network className="h-3 w-3" />
                                                            <span>Inbred Pairing</span>
                                                        </div>
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
                <AlertDialogContent className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                            Name New Pair
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                            Provide a name for this new breeding pair.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Label
                            htmlFor="pair-name"
                            className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson"
                        >
                            Pair Name
                        </Label>
                        <Input
                            id="pair-name"
                            value={newPairName}
                            onChange={(e) => setNewPairName(e.target.value)}
                            placeholder="e.g., Main Cielarka Pair"
                            className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss mt-1"
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
