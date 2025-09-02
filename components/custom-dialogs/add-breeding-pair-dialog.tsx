'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { BreedingPairForm } from '../custom-forms/breeding-pair-form';
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    EnrichedBreedingPair,
} from '@/types';

type AddBreedingPairDialogProps = {
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: EnrichedBreedingPair[];
    baseCreature?: EnrichedCreature;
    children?: React.ReactNode;
};

export function AddBreedingPairDialog({
    allCreatures,
    allGoals,
    allPairs,
    baseCreature,
    children,
}: AddBreedingPairDialogProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const handleFormSubmit = async (values: any) => {
        setIsSubmitting(true);
        setApiError(null);

        try {
            const response = await fetch('/api/breeding-pairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                // THIS IS THE FIX: Check for detailed validation errors
                if (data.details?.fieldErrors) {
                    // This part requires the form component to be able to handle setting errors
                    // For now, we'll show a generic message but the structure is here.
                    setApiError('Please check the form for errors.');
                } else {
                    setApiError(data.error || 'An unknown error occurred.');
                }
                return;
            }

            router.refresh();
            setIsOpen(false);
        } catch (error) {
            setApiError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || <Button>+ New Pair</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Breeding Pair</DialogTitle>
                </DialogHeader>
                <BreedingPairForm
                    {...{
                        allCreatures,
                        allGoals,
                        allPairs,
                        onSubmit: handleFormSubmit,
                        isSubmitting,
                        apiError,
                        baseCreature,
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
