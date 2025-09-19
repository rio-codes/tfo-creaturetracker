'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddPairForm } from '@/components/custom-forms/add-breeding-pair-form';
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    DbBreedingPair,
    DbBreedingLogEntry,
} from '@/types';

type AddBreedingPairDialogProps = {
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    baseCreature?: EnrichedCreature | null;
    initialGoal?: EnrichedResearchGoal | null;
    children?: React.ReactNode;
};

export function AddBreedingPairDialog({
    allCreatures,
    allGoals,
    allPairs,
    allLogs,
    baseCreature,
    initialGoal,
    children,
}: AddBreedingPairDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
                className="text-xl mb-8 bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 drop-shadow-md drop-shadow-gray-500"
                asChild
            >
                {children || (
                    <Button className="bg-pompaca-purple text-barely-lilac">+ New Pair</Button>
                )}
            </DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple max-h-[85vh] overflow-y-auto w-full max-w-2xl [&>button]:hidden"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300">
                        Create New Breeding Pair
                    </DialogTitle>
                </DialogHeader>
                <AddPairForm
                    allCreatures={allCreatures}
                    allGoals={allGoals}
                    allPairs={allPairs}
                    allLogs={allLogs}
                    baseCreature={baseCreature}
                    initialGoal={initialGoal}
                    onSuccess={() => setIsOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
