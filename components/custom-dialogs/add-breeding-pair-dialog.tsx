"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddPairForm } from "@/components/custom-forms/add-breeding-pair-form"
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    DbBreedingPair,
    DbBreedingLogEntry,
} from "@/types";

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
    const renderId = Math.random().toString(36).substring(7);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-pompaca-purple text-barely-lilac">
                        + New Pair
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-barely-lilac max-h-3/4 overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple">
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
