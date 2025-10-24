'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AddPairForm } from '@/components/custom-forms/add-breeding-pair-form';
import type { EnrichedCreature, EnrichedResearchGoal, EnrichedBreedingPair } from '@/types';
import { Loader2 } from 'lucide-react';

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
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [context, setContext] = useState<AddPairContext | null>(null);

    useEffect(() => {
        if (isOpen && !context) {
            const fetchContext = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    // This API route fetches all necessary data for the form
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
            fetchContext();
        } else if (!isOpen) {
            setContext(null);
        }
    }, [isOpen, context]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e: PointerDownOutsideEvent) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet max-h-[85vh] overflow-y-auto w-full max-w-2xl [&>button]:hidden"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                        Create a New Pair for Goal: {goal.name}
                    </DialogTitle>
                </DialogHeader>
                {isLoading && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {context && <AddPairForm initialGoal={goal} onSuccess={() => setIsOpen(false)} />}
            </DialogContent>
        </Dialog>
    );
}
