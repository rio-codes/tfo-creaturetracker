"use client";
import { useState } from "react";
import { GoalForm } from "@/components/custom-forms/goal-form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@radix-ui/react-dialog";

export function AddGoalDialog() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 mb-5">
                    + New Goal
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple max-h-3/4 overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Research Goal</DialogTitle>
                </DialogHeader>
                <GoalForm onSuccess={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}