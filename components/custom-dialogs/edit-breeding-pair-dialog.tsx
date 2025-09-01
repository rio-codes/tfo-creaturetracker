"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { EditBreedingPairForm } from "@/components/custom-forms/edit-breeding-pair-form"
import type { EnrichedBreedingPair, EnrichedCreature, EnrichedResearchGoal, DbBreedingPair, DbBreedingLogEntry } from "@/types";


type EditBreedingPairDialogProps = {
    pair: EnrichedBreedingPair;
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    children: React.ReactNode;
};

export function EditBreedingPairDialog({
    pair,
    allCreatures,
    allGoals,
    allPairs,
    allLogs,
    children,
}: EditBreedingPairDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300">
                        Edit Breeding Pair
                    </DialogTitle>
                </DialogHeader>
                <EditBreedingPairForm
                    pair={pair}
                    allCreatures={allCreatures}
                    allGoals={allGoals}
                    allPairs={allPairs}
                    allLogs={allLogs}
                    onSuccess={() => setIsOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
