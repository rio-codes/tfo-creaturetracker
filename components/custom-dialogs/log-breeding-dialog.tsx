'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { LogBreedingForm } from '@/components/custom-forms/log-breeding-form';
import type { EnrichedCreature } from '@/types';

type LogBreedingDialogProps = {
    pair: { id: string | undefined; species: string };
    allCreatures: EnrichedCreature[];
    children: React.ReactNode; // The trigger button
};

export function LogBreedingDialog({ pair, allCreatures, children }: LogBreedingDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple [&>button]:hidden"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300">
                        Log New Breeding Event
                    </DialogTitle>
                </DialogHeader>
                <LogBreedingForm
                    pair={pair}
                    allCreatures={allCreatures}
                    onSuccess={() => setIsOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
