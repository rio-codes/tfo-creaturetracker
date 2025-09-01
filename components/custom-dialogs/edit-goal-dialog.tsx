import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GoalForm } from "@/components/custom-forms/goal-form";
import type { EnrichedResearchGoal } from "@/types";

type EditGoalDialogProps = {
    goal: EnrichedResearchGoal;
};

export function EditGoalDialog({ goal }: EditGoalDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-16 w-25">
                    <span className="text-wrap wrap-normal text-sm/tight">
                        Edit or Delete Goal
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple max-h-3/4 overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Research Goal</DialogTitle>
                </DialogHeader>
                <GoalForm goal={goal} onSuccess={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
