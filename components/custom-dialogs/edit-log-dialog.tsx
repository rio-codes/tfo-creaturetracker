'use client';

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type {
    EnrichedCreature,
    EnrichedBreedingPair,
    DbBreedingLogEntry,
    SerializedBreedingLogEntry,
} from '@/types';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules';
import { CreatureCombobox } from '@/components/misc-custom-components/creature-combobox';

type EditLogDialogProps = {
    children: React.ReactNode;
    log: SerializedBreedingLogEntry;
    pair: EnrichedBreedingPair;
};

type EditLogContext = {
    allCreatures: EnrichedCreature[];
    allLogs: DbBreedingLogEntry[];
};

export function EditLogDialog({ children, log, pair }: EditLogDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState(log.notes || '');
    const [progeny1Id, setProgeny1Id] = useState<string | null>(log.progeny1Id);
    const [progeny2Id, setProgeny2Id] = useState<string | null>(log.progeny2Id);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [isContextLoading, setIsContextLoading] = useState(false);
    const [context, setContext] = useState<EditLogContext | null>(null);

    useEffect(() => {
        if (open) {
            // Reset form fields to initial log state when opening
            setNotes(log.notes || '');
            setProgeny1Id(log.progeny1Id);
            setProgeny2Id(log.progeny2Id);
            setError('');
            setIsLoading(false);

            // Fetch context if it's not already loaded
            if (!context) {
                const fetchContext = async () => {
                    setIsContextLoading(true);
                    try {
                        const response = await fetch('/api/breeding-log/edit-context');
                        if (!response.ok) {
                            throw new Error('Failed to load data for editing log.');
                        }
                        const data = await response.json();
                        setContext(data);
                    } catch (err: any) {
                        setError(err.message);
                    } finally {
                        setIsContextLoading(false);
                    }
                };
                fetchContext();
            }
        } else {
            // Reset context when dialog closes to ensure fresh data next time
            setContext(null);
        }
    }, [open, log]);

    const possibleProgeny = useMemo(() => {
        if (
            !pair.maleParent ||
            !pair.femaleParent ||
            !pair.maleParent.species ||
            !pair.femaleParent.species ||
            !context
        )
            return [];

        const possibleSpecies = getPossibleOffspringSpecies(
            pair.maleParent.species,
            pair.femaleParent.species
        );

        // Find all creature IDs that are already assigned as progeny in other logs
        const assignedCreatureIds = new Set(
            context.allLogs
                .filter((l) => l.id !== log.id) // Exclude the current log from the check
                .flatMap((l) => [l.progeny1Id, l.progeny2Id])
                .filter((id): id is string => !!id)
        );

        // Return creatures that match possible species and are not already assigned elsewhere
        return context.allCreatures.filter(
            (c) =>
                c?.species && possibleSpecies.includes(c.species) && !assignedCreatureIds.has(c.id)
        );
    }, [context, pair, log.id]);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/breeding-log`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logId: log.id,
                    notes: notes || undefined,
                    progeny1Id: progeny1Id || null,
                    progeny2Id: progeny2Id || null,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update log entry.');
            }

            router.refresh();
            setOpen(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderProgenySelect = (
        selectedValue: string | null,
        onValueChange: (value: string | null) => void,
        otherSelectedId: string | null,
        label: string
    ) => (
        <div className="space-y-2">
            <Label>{label}</Label>
            <CreatureCombobox
                creatures={possibleProgeny.filter((c) => c?.id !== otherSelectedId)}
                selectedCreatureId={selectedValue || undefined}
                onSelectCreature={(id) => onValueChange(id || null)}
                placeholder="Select progeny..."
            />
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple text-pompaca-purple dark:text-barely-lilac [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle>Edit Log Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 min-h-[300px]">
                    {isContextLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : context ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any notes about this breeding event..."
                                    className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac"
                                />
                            </div>
                            {renderProgenySelect(
                                progeny1Id,
                                setProgeny1Id,
                                progeny2Id,
                                'Progeny 1'
                            )}
                            {renderProgenySelect(
                                progeny2Id,
                                setProgeny2Id,
                                progeny1Id,
                                'Progeny 2'
                            )}
                        </>
                    ) : null}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac"
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || isContextLoading}
                        className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
