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

export function EditGoalDialog({
    goal,
    isAdminView = false,
    variant = 'card',
}: EditGoalDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    const buttonClassName =
        variant === 'detail'
            ? 'bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-16 w-25 text-sm/tight'
            : 'bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-9 w-30 text-sm/tight';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-13 w-30 text-sm/tight">
                    <span className="text-wrap wrap-normal text-xs">Edit / Delete Goal</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple max-h-3/4 overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Research Goal</DialogTitle>
                </DialogHeader>
                <GoalForm
                    goal={goal}
                    onSuccess={() => setIsOpen(false)}
                    isAdminView={isAdminView}
                />
            </DialogContent>
        </Dialog>
    );
}
