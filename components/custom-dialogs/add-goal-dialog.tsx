'use client';
import { useState } from 'react';
import { GoalForm } from '@/components/custom-forms/goal-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@radix-ui/react-dialog';

type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export function AddGoalDialog() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="text-xl mb-8 bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 drop-shadow-md drop-shadow-gray-500 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson">
                    + New Goal
                </Button>
            </DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e: PointerDownOutsideEvent) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet max-h-3/4 overflow-y-auto [&>button]:hidden"
            >
                <DialogHeader>
                    <DialogTitle>Create New Research Goal</DialogTitle>
                </DialogHeader>
                <GoalForm onSuccess={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
