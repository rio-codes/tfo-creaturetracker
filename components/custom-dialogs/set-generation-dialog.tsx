'use client';

import React from 'react';
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
    const [origin, setorigin] = useState(creature?.origin || 'none');

    const isG1 = generation === 1 || generation === '1';

    // do not allow generation to be manually changed if creature is logged as progeny
    const isProgeny = creature?.origin === 'bred';
    if (isProgeny) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-barely-lilac dark:bg-pompaca-purple">
                    <DialogHeader>
                        <DialogTitle>
                            Set Generation for {creature?.creatureName || creature?.code}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-dusk-purple dark:text-purple-400">
                            This creature is logged as progeny of a breeding pair. Its generation is
                            automatically determined and cannot be manually changed.
                        </p>
                        <p className="mt-2 text-sm text-dusk-purple dark:text-purple-400">
                            Current Generation: <strong>G{creature.generation}</strong>
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={() => setIsOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const handleGenerationChange = (value: string) => {
        setGeneration(value ? Number(value) : '');
        const newIsG1 = value === '1';
        if (!newIsG1 && origin !== 'another-lab') {
            setorigin('none');
        }
    };

    const handleSave = async () => {
        setIsLoading(true);

        const generationValue = generation === '' ? null : Number(generation);
        const originValue = origin !== 'none' ? origin : null;

        try {
            const response = await fetch(`/api/creatures/${creature?.id}/generation`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generation: generationValue, origin: originValue }),
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
                            onChange={(e) => handleGenerationChange(e.target.value)}
                            className="min-w-0 max-w-15 text-left bg-ebena-lavender dark:text-barely-lilac dark:bg-midnight-purple"
                        />

                        <Label htmlFor="g1-origin" className="text-left">
                            Origin:
                        </Label>
                        <Select
                            value={origin}
                            onValueChange={(value) => {
                                setorigin(value as any);
                            }}
                        >
                            <SelectTrigger className="bg-ebena-lavender dark:text-barely-lilac dark:bg-midnight-purple">
                                <SelectValue placeholder="Select origin..." />
                            </SelectTrigger>
                            <SelectContent className="bg-ebena-lavender dark:text-barely-lilac dark:bg-midnight-purple">
                                <SelectItem value="unknown">Unknown</SelectItem>
                                <SelectItem value="cupboard" disabled={!isG1}>
                                    Cupboard
                                </SelectItem>
                                <SelectItem value="quest" disabled={!isG1}>
                                    Quest
                                </SelectItem>
                                <SelectItem value="genome-splicer" disabled={!isG1}>
                                    Genome Splicer
                                </SelectItem>
                                <SelectItem value="raffle" disabled={!isG1}>
                                    Raffle
                                </SelectItem>
                                <SelectItem value="another-lab">Another Lab</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-dusk-purple dark:text-purple-400 col-span-4 py-5">
                        Origins other than &#34;Another Lab&#34; can only be set if Generation is 1.
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
