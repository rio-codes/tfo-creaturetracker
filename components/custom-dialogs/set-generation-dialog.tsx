'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { EnrichedCreature } from '@/types';

interface SetGenerationDialogProps {
    creature: EnrichedCreature;
    children: React.ReactNode;
}

export function SetGenerationDialog({ creature, children }: SetGenerationDialogProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [generation, setGeneration] = useState<number | string>(creature?.generation ?? 1);
    const [g1Origin, setG1Origin] = useState(creature?.g1Origin || 'none');

    const isG1 = generation === 1 || generation === '1';

    const handleSave = async () => {
        setIsLoading(true);

        const generationValue = generation === '' ? null : Number(generation);
        const originValue = isG1 && g1Origin !== 'none' ? g1Origin : null;

        try {
            const response = await fetch(`/api/creatures/${creature?.id}/generation`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generation: generationValue, g1Origin: originValue }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update generation.');
            }

            toast.success('Generation information updated.');
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-barely-lilac dark:bg-pompaca-purple">
                <DialogHeader>
                    <DialogTitle>
                        Set Generation for {creature?.creatureName || creature?.code}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-col py-4 w-full">
                    <div className="flex min-w-0 w-full justify-between">
                        <Label htmlFor="generation" className="text-left">
                            Generation:
                        </Label>
                        <Input
                            id="generation"
                            type="number"
                            min="1"
                            value={generation}
                            onChange={(e) =>
                                setGeneration(e.target.value ? Number(e.target.value) : '')
                            }
                            className="min-w-0 max-w-15 text-left bg-ebena-lavender dark:text-barely-lilac dark:bg-midnight-purple"
                        />

                        <Label htmlFor="g1-origin" className="text-left">
                            Origin if G1:
                        </Label>
                        <Select value={g1Origin} onValueChange={setG1Origin} disabled={!isG1}>
                            <SelectTrigger className="bg-ebena-lavender dark:text-barely-lilac dark:bg-midnight-purple">
                                <SelectValue placeholder="Select origin..." />
                            </SelectTrigger>
                            <SelectContent className="bg-ebena-lavender dark:text-barely-lilac dark:bg-midnight-purple">
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="cupboard">Cupboard</SelectItem>
                                <SelectItem value="genome-splicer">Genome Splicer</SelectItem>
                                <SelectItem value="another-lab">Another Lab</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-dusk-purple dark:text-purple-400 col-span-4 py-5">
                        Origin can only be set if Generation is 1.
                    </p>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-pompaca-purple text-barely-lilac dark:bg-purple-300 dark:text-pompaca-purple"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
