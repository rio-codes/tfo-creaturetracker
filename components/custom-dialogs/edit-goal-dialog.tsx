"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { EditGoalForm } from "@/components/custom-forms/edit-goal-form"
import type { EnrichedResearchGoal } from "@/types";

type EditGoalDialogProps = {
    goalMode: String;
    goal: EnrichedResearchGoal;
    children: React.ReactNode; // The trigger button
};

export function EditGoalDialog({ goalMode, goal, children }: EditGoalDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    console.log("edit goal mode on dialog", goalMode)
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac rounded-lg shadow-xl flex-col overflow-y-auto p-6 space-y-4 w-full max-h-3/4 max-w-md z-50">
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple">
                        Edit Research Goal
                    </DialogTitle>
                </DialogHeader>
                <EditGoalForm
                    goalMode={goalMode}
                    goal={goal}
                    onSuccess={() => setIsOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}