'use client';

import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AddPairForm } from '@/components/custom-forms/add-breeding-pair-form';
import type { EnrichedCreature, EnrichedResearchGoal, EnrichedBreedingPair } from '@/types';
import { Loader2, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules-client';

type ManageGoalPairsDialogProps = {
    goal: EnrichedResearchGoal;
    children: React.ReactNode;
};

type AddPairContext = {
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: EnrichedBreedingPair[];
};

type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export function ManageGoalPairsDialog({ goal, children }: ManageGoalPairsDialogProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [context, setContext] = useState<AddPairContext | null>(null);
    const [activeTab, setActiveTab] = useState<'assign' | 'create'>('assign');
    const [updatingPairId, setUpdatingPairId] = useState<string | null>(null);
    const [assignedPairIds, setAssignedPairIds] = useState<string[]>(goal.assignedPairIds || []);

    useEffect(() => {
        setAssignedPairIds(goal.assignedPairIds || []);
    }, [goal.assignedPairIds]);

    const fetchContext = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/breeding-pairs/add-context');
            if (!response.ok) {
                throw new Error('Failed to load data for managing pairs.');
            }
            const data = await response.json();
            setContext(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !context) {
            fetchContext();
        } else if (!isOpen) {
            setContext(null);
            setActiveTab('assign');
        }
    }, [isOpen, context]);

    const compatiblePairs = useMemo(() => {
        if (!context?.allPairs) return [];
        return context.allPairs.filter((pair) => {
            if (!pair.maleParent?.species || !pair.femaleParent?.species) return false;
            const possibleOffspring = getPossibleOffspringSpecies(
                pair.maleParent.species,
                pair.femaleParent.species
            );
            return possibleOffspring.some((o) => o.species === goal.species);
        });
    }, [context?.allPairs, goal.species]);

    const handleToggleAssignment = async (pairId: string, assign: boolean) => {
        setUpdatingPairId(pairId);
        try {
            const response = await fetch(`/api/breeding-pairs/${pairId}/assign-goal`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goalId: goal.id, assign }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update pair assignment.');
            }
            setAssignedPairIds((prev) =>
                assign ? [...prev, pairId] : prev.filter((id) => id !== pairId)
            );
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUpdatingPairId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e: PointerDownOutsideEvent) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet max-h-[85vh] overflow-y-auto w-full max-w-2xl"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                        Manage Breeding Pairs for Goal: {goal.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 border-b pb-2 mb-4">
                    <Button
                        size="sm"
                        variant={activeTab === 'assign' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('assign')}
                    >
                        Assign Existing Pairs
                    </Button>
                    <Button
                        size="sm"
                        variant={activeTab === 'create' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('create')}
                    >
                        <Plus className="w-4 h-4 mr-1" /> Create New Pair
                    </Button>
                </div>

                {isLoading && <Loader2 className="mx-auto h-8 w-8 animate-spin my-4" />}
                {error && <p className="text-red-500 text-center">{error}</p>}

                {context && activeTab === 'assign' && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Select existing breeding pairs to assign or unassign from this research goal ({goal.species}).
                        </p>
                        {compatiblePairs.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto space-y-2 rounded-md border p-3 bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss">
                                {compatiblePairs.map((pair) => {
                                    const isAssigned = assignedPairIds.includes(pair.id);
                                    const isUpdating = updatingPairId === pair.id;
                                    return (
                                        <div
                                            key={pair.id}
                                            className="flex items-center justify-between p-2 rounded bg-barely-lilac/60 dark:bg-pompaca-purple/40"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={`pair-${pair.id}`}
                                                    checked={isAssigned}
                                                    disabled={isUpdating}
                                                    onCheckedChange={(checked) =>
                                                        handleToggleAssignment(pair.id, !!checked)
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`pair-${pair.id}`}
                                                    className="font-medium cursor-pointer"
                                                >
                                                    {pair.pairName}{' '}
                                                    <span className="text-xs text-muted-foreground">
                                                        ({pair.maleParent?.code} x {pair.femaleParent?.code})
                                                    </span>
                                                </Label>
                                            </div>
                                            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm italic text-muted-foreground py-4 text-center">
                                No compatible breeding pairs found in your collection. Click &#34;Create New Pair&#34; to make one.
                            </p>
                        )}
                    </div>
                )}

                {context && activeTab === 'create' && (
                    <AddPairForm
                        initialGoal={goal}
                        onSuccess={() => {
                            fetchContext();
                            setActiveTab('assign');
                            router.refresh();
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
