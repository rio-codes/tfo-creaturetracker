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
import { EditBreedingPairForm } from '@/components/custom-forms/edit-breeding-pair-form';
import type {
    EnrichedBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
    DbBreedingPair,
} from '@/types';
import { Loader2 } from 'lucide-react';

type EditContextData = {
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
};

type EditBreedingPairDialogProps = {
    pair: EnrichedBreedingPair;
    children: React.ReactNode;
};

type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export function EditBreedingPairDialog({ pair, children }: EditBreedingPairDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editContext, setEditContext] = useState<EditContextData | null>(null);

    useEffect(() => {
        if (isOpen && !editContext) {
            const fetchContext = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(`/api/breeding-pairs/${pair.id}/edit-context`);
                    if (!response.ok) {
                        throw new Error('Failed to load data for editing pair.');
                    }
                    const data = await response.json();
                    setEditContext(data);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchContext();
        } else if (!isOpen) {
            // Reset when dialog closes
            setEditContext(null);
        }
    }, [isOpen, pair.id, editContext]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e: PointerDownOutsideEvent) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet [&>button]:hidden w-full md:max-w-2xl overflow-y-auto max-h-[90vh]"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson w-full text-center">
                        Edit Breeding Pair
                    </DialogTitle>
                </DialogHeader>
                <div className="min-h-[400px]">
                    {isLoading && (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-pompaca-purple hallowsnight:text-ruzafolio-scarlet" />
                        </div>
                    )}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {!isLoading && !error && editContext && (
                        <EditBreedingPairForm
                            pair={pair}
                            allCreatures={editContext.allCreatures}
                            allGoals={editContext.allGoals}
                            onSuccess={() => setIsOpen(false)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
