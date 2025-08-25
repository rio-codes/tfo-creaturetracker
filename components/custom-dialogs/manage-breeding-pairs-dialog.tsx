"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ManageBreedingPairsForm } from "@/components/custom-forms/manage-breeding-pairs-form"
import type { EnrichedCreature, EnrichedResearchGoal, EnrichedBreedingPair } from "@/types";

type ManageBreedingPairsDialogProps = {
    baseCreature: EnrichedCreature;
    allCreatures: EnrichedCreature[];
    allPairs: EnrichedBreedingPair[];
    allGoals: EnrichedResearchGoal[];
    children: React.ReactNode;
};

export function ManageBreedingPairsDialog({
    baseCreature,
    allCreatures,
    allPairs,
    allGoals,
    children,
}: ManageBreedingPairsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac">
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple">
                        Manage Pairs for{" "}
                        {baseCreature!.creatureName || baseCreature!.code}
                    </DialogTitle>
                </DialogHeader>
                <ManageBreedingPairsForm
                    baseCreature={baseCreature}
                    allCreatures={allCreatures}
                    allPairs={allPairs}
                    allGoals={allGoals}
                    onActionComplete={() => {
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
