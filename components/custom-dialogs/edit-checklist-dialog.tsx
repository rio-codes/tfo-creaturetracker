'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EnrichedChecklist, EnrichedCreature } from '@/types';
import { EditChecklistForm } from '@/components/custom-forms/edit-checklist-form';
import { useRouter } from 'next/navigation';

type EditChecklistDialogProps = {
    checklist: EnrichedChecklist;
    allCreatures: EnrichedCreature[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

export function EditChecklistDialog({
    checklist,
    allCreatures,
    isOpen,
    onOpenChange,
}: EditChecklistDialogProps) {
    const router = useRouter();

    const handleSuccess = () => {
        onOpenChange(false);
        router.refresh();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet">
                <DialogHeader>
                    <DialogTitle>Edit Checklist</DialogTitle>
                    <DialogDescription>
                        Make changes to your checklist here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <EditChecklistForm
                    checklist={checklist}
                    allCreatures={allCreatures}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}
