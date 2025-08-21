"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { EditGoalForm } from "@/components/edit-goal-form"
import type { ResearchGoal } from "@/types";

type EditGoalDialogProps = {
    goal: ResearchGoal;
    children: React.ReactNode; // The trigger button
};

export function EditGoalDialog({ goal, children }: EditGoalDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac">
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple">
                        Edit Research Goal
                    </DialogTitle>
                </DialogHeader>
                <EditGoalForm goal={goal} onSuccess={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}