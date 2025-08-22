"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ManageBreedingPairsForm } from "@/components/manage-breeding-pairs-form"
import type { Creature, ResearchGoal } from "@/types";

type BreedingPairWithDetails = {
    id: string;
    pairName: string;
    maleParent: Creature;
    femaleParent: Creature;
};

type ManageBreedingPairsDialogProps = {
    baseCreature: Creature;
    allCreatures: Creature[];
    allPairs: BreedingPairWithDetails[];
    children: React.ReactNode;
};

export function ManageBreedingPairsDialog({
    baseCreature,
    allCreatures,
    allPairs,
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
                        {baseCreature.creatureName || baseCreature.code}
                    </DialogTitle>
                </DialogHeader>
                <ManageBreedingPairsForm
                    baseCreature={baseCreature}
                    allCreatures={allCreatures}
                    allPairs={allPairs}
                    onActionComplete={() => {
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
