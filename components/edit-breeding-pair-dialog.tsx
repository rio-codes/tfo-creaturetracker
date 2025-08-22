"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { EditBreedingPairForm } from "@/components/edit-breeding-pair-form"
import type { BreedingPairWithDetails, Creature, ResearchGoal } from "@/types";


type EditBreedingPairDialogProps = {
    pair: BreedingPairWithDetails;
    allCreatures: Creature[];
    allGoals: ResearchGoal[];
    children: React.ReactNode; 
};

export function EditBreedingPairDialog({
    pair,
    allCreatures,
    allGoals,
    children,
}: EditBreedingPairDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac">
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple">
                        Edit Breeding Pair
                    </DialogTitle>
                </DialogHeader>
                <EditBreedingPairForm
                    pair={pair}
                    allCreatures={allCreatures}
                    allGoals={allGoals}
                    onSuccess={() => setIsOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
