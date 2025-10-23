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
import { ManageBreedingPairsForm } from '@/components/custom-forms/manage-breeding-pairs-form';
import type { EnrichedCreature, EnrichedResearchGoal, EnrichedBreedingPair } from '@/types';
import { Loader2 } from 'lucide-react';

type ManageBreedingPairsDialogProps = {
    baseCreature: EnrichedCreature;
    children: React.ReactNode;
};

type PairingContextData = {
    existingPairs: EnrichedBreedingPair[];
    suitableMates: EnrichedCreature[];
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
};

type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export function ManageBreedingPairsDialog({
    baseCreature,
    children,
}: ManageBreedingPairsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pairingContext, setPairingContext] = useState<PairingContextData | null>(null);

    useEffect(() => {
        if (isOpen && !pairingContext) {
            const fetchContext = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(
                        `/api/creatures/${baseCreature?.id}/pairing-context`
                    );
                    if (!response.ok) {
                        throw new Error('Failed to load data for managing pairs.');
                    }
                    const data = await response.json();
                    setPairingContext(data);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchContext();
        } else if (!isOpen) {
            // Reset when dialog closes
            setPairingContext(null);
        }
    }, [isOpen, baseCreature?.id, pairingContext]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e: PointerDownOutsideEvent) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet max-h-2/3 overflow-y-auto [&>button]:hidden"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                        Manage Pairs for {baseCreature!.creatureName || baseCreature!.code}
                    </DialogTitle>
                </DialogHeader>
                <div className="min-h-[300px]">
                    {isLoading && (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-pompaca-purple hallowsnight:text-cimo-crimson" />
                        </div>
                    )}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {!isLoading && !error && pairingContext && (
                        <ManageBreedingPairsForm
                            baseCreature={baseCreature}
                            existingPairs={pairingContext.existingPairs}
                            suitableMates={pairingContext.suitableMates}
                            allCreatures={pairingContext.allCreatures}
                            allGoals={pairingContext.allGoals}
                            onActionCompleteAction={() => setIsOpen(false)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
