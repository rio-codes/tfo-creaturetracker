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
import type { Creature, ResearchGoal } from "@/types";

// Define the shape of the pair data the dialog expects
type BreedingPairWithDetails = {
    id: string;
    pairName: string;
    species: string;
    maleParentId: string;
    femaleParentId: string;
    assignedGoalIds: string[] | null;
};

type EditBreedingPairDialogProps = {
    pair: BreedingPairWithDetails;
    allCreatures: Creature[];
    allGoals: ResearchGoal[];
    children: React.ReactNode; // The trigger button
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
