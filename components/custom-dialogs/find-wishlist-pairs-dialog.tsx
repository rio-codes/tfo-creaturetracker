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
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import type { EnrichedCreature, EnrichedResearchGoal } from '@/types';
import { toast } from 'sonner';

type PotentialPairPrediction = {
    maleParent: EnrichedCreature;
    femaleParent: EnrichedCreature;
    averageChance: number;
    isPossible: boolean;
    isInbred: boolean;
    existingPairName?: string;
    existingPairId?: string;
};

type FindWishlistPairsDialogProps = {
    goal: EnrichedResearchGoal;
    owner: {
        username: string | null;
        id: string;
        allowWishlistGoalSaving: boolean;
    };
    children: React.ReactNode;
};

export function FindWishlistPairsDialog({
    goal,
    owner: { username: ownerUsername, id: _ownerId, allowWishlistGoalSaving },
    children,
}: FindWishlistPairsDialogProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [potentialPairPredictions, setPotentialPairPredictions] = useState<
        PotentialPairPrediction[]
    >([]);
    const [savedGoalId, setSavedGoalId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setPotentialPairPredictions([]);
            setSavedGoalId(null);
            return;
        }

        const findPairs = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/wishlist/find-pairs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(goal), // Send the whole goal object
                });
                if (!response.ok) throw new Error('Failed to find potential pairs.');
                const data = await response.json();
                setPotentialPairPredictions(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        findPairs();
    }, [isOpen, goal.id]);

    const handleSaveGoal = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/research-goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...goal,
                    name: `[Wish] ${goal.name}`,
                    isPublic: false, // Default to private when saving
                }),
            });
            if (!response.ok) throw new Error('Failed to save goal.');
            const data = await response.json();
            setSavedGoalId(data.goalId);
            toast.success('Goal saved to your collection!');
            router.refresh();
        } catch (error: any) {
            toast.error('Failed to save goal', { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignPair = async (pairId: string) => {
        if (!savedGoalId) return;
        setIsCreating(pairId);
        try {
            await fetch(`/api/breeding-pairs/${pairId}/assign-goal`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goalId: savedGoalId, assign: true }),
            });
            toast.success('Pair assigned to your new goal!');
        } catch (error: any) {
            toast.error('Failed to assign pair', { description: error.message });
        } finally {
            setIsCreating(null);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="max-w-3xl bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet">
                    <DialogHeader>
                        <DialogTitle>Can You Breed: {goal.name}?</DialogTitle>
                        <DialogDescription>
                            Here are pairs from your collection that could produce this goal.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : potentialPairPredictions.length > 0 ? (
                                potentialPairPredictions.map(
                                    ({ maleParent, femaleParent, existingPairId }) => {
                                        const currentPairId =
                                            existingPairId ||
                                            `${maleParent?.id}-${femaleParent?.id}`;
                                        return (
                                            <div
                                                key={currentPairId}
                                                className="flex items-center justify-between p-2 rounded-md bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss"
                                            >
                                                <p>
                                                    {maleParent?.creatureName} &{' '}
                                                    {femaleParent?.creatureName}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAssignPair(currentPairId)}
                                                    disabled={
                                                        !existingPairId ||
                                                        isCreating === currentPairId ||
                                                        !savedGoalId
                                                    }
                                                    title={
                                                        !savedGoalId
                                                            ? 'Save the goal first to enable assignment'
                                                            : ''
                                                    }
                                                >
                                                    {isCreating === currentPairId ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        'Assign'
                                                    )}
                                                </Button>
                                            </div>
                                        );
                                    }
                                )
                            ) : (
                                <p className="text-center italic py-8">
                                    No possible pairs found in your collection.
                                </p>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <div className="flex-grow flex items-center gap-4 text-sm">
                            {allowWishlistGoalSaving ? (
                                !savedGoalId ? (
                                    <Button onClick={handleSaveGoal} disabled={isLoading} size="sm">
                                        {isLoading ? (
                                            <Loader2 className="animate-spin" />
                                        ) : (
                                            'Save Goal to Assign Pairs'
                                        )}
                                    </Button>
                                ) : (
                                    <p className="text-green-600 dark:text-green-400">
                                        Goal saved! You can now assign pairs.
                                    </p>
                                )
                            ) : (
                                <p className="text-dusk-purple dark:text-purple-400 italic">
                                    If you want to save this goal, ask {ownerUsername} to enable
                                    goal saving in their settings.
                                </p>
                            )}
                        </div>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
