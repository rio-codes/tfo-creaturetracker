'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { GoalForm } from '../custom-forms/goal-form';
import type { EnrichedResearchGoal } from '@/types';

type EditGoalDialogProps = {
    goal: EnrichedResearchGoal;
    isAdminView?: boolean;
    variant?: 'card' | 'detail';
};

export function EditGoalDialog({ goal, isAdminView = false }: EditGoalDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-13 w-30 text-sm/tight hallowsnight:text-cimo-crimson hallowsnight:bg-blood-bay-wine">
                    <span className="text-wrap wrap-normal text-xs">Edit / Delete Goal</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet max-h-3/4 overflow-y-auto [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle>Edit Research Goal</DialogTitle>
                </DialogHeader>
                <GoalForm
                    goal={goal}
                    onSuccessAction={() => setIsOpen(false)}
                    isAdminView={isAdminView}
                />
            </DialogContent>
        </Dialog>
    );
}
