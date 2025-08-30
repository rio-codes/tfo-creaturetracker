"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { LogBreedingForm } from "@/components/custom-forms/log-breeding-form";
import type { EnrichedCreature, EnrichedBreedingPair } from "@/types";

type LogBreedingDialogProps = {
    pair: { id: string | undefined; species: string };
    allCreatures: EnrichedCreature[];
    children: React.ReactNode; // The trigger button
};

export function LogBreedingDialog({
    pair,
    allCreatures,
    children,
}: LogBreedingDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac">
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple">
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
