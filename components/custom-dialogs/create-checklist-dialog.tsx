'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { CreateChecklistForm } from '@/components/custom-forms/create-checklist-form';
import { PlusCircle } from 'lucide-react';

export function CreateChecklistDialog() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Checklist
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet">
                <DialogHeader>
                    <DialogTitle>Create New Checklist</DialogTitle>
                    <DialogDescription>
                        Define a new checklist to track your collection progress for specific genes.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <CreateChecklistForm onSuccess={() => setIsOpen(false)} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
