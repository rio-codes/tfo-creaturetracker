'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ManageBreedingPairsForm } from '@/components/custom-forms/manage-breeding-pairs-form';
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    EnrichedBreedingPair,
    DbBreedingPair,
    DbBreedingLogEntry,
} from '@/types';

type ManageBreedingPairsDialogProps = {
    baseCreature: EnrichedCreature;
    allCreatures: EnrichedCreature[];
    allPairs: EnrichedBreedingPair[];
    allGoals: EnrichedResearchGoal[];
    allRawPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    children: React.ReactNode;
};

export function ManageBreedingPairsDialog({
    baseCreature,
    allCreatures,
    allPairs,
    allGoals,
    allRawPairs,
    allLogs,
    children,
}: ManageBreedingPairsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple max-h-2/3 overflow-y-auto"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300">
                        Manage Pairs for {baseCreature!.creatureName || baseCreature!.code}
                    </DialogTitle>
                </DialogHeader>
                <ManageBreedingPairsForm
                    baseCreature={baseCreature}
                    allCreatures={allCreatures}
                    allPairs={allPairs}
                    allGoals={allGoals}
                    allRawPairs={allRawPairs}
                    allLogs={allLogs}
                    onActionCompleteAction={() => setIsOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
