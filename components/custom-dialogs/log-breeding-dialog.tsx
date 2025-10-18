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
import { LogBreedingForm } from '@/components/custom-forms/log-breeding-form';
import type { EnrichedBreedingPair, EnrichedCreature } from '@/types';
import { Loader2 } from 'lucide-react';

type LogBreedingDialogProps = {
    pair: EnrichedBreedingPair;
    children: React.ReactNode;
};

type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export function LogBreedingDialog({ pair, children }: LogBreedingDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [creatureList, setCreatureList] = useState<EnrichedCreature[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !creatureList) {
            const fetchCreatures = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch('/api/creatures/for-user');
                    if (!response.ok) {
                        throw new Error('Failed to load creature data.');
                    }
                    const data = await response.json();
                    setCreatureList(data);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCreatures();
        } else if (!isOpen) {
            setCreatureList(null);
        }
    }, [isOpen, creatureList]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e: PointerDownOutsideEvent) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet [&>button]:hidden"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                        Log New Breeding Event
                    </DialogTitle>
                </DialogHeader>
                <div className="min-h-[250px]">
                    {isLoading && (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-pompaca-purple" />
                        </div>
                    )}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {!isLoading && !error && creatureList && (
                        <LogBreedingForm
                            pair={{
                                id: pair.id,
                                maleParent: pair.maleParent!,
                                femaleParent: pair.femaleParent!,
                            }}
                            allCreatures={creatureList}
                            onSuccess={() => setIsOpen(false)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
