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
import { getPossibleOffspringSpecies } from '@/lib/genetics';
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
    const [progeny1, setProgeny1] = useState<EnrichedCreature | null | undefined>(undefined);
    const [progeny2, setProgeny2] = useState<EnrichedCreature | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [isContextLoading, setIsContextLoading] = useState(false);
    const [context, setContext] = useState<EditLogContext | null>(null);

    useEffect(() => {
        if (open) {
            setNotes(log.notes || '');
            setError('');
            setIsLoading(false);

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
            setContext(null);
            setProgeny1(undefined);
            setProgeny2(undefined);
        }
    }, [open, log]);

    useEffect(() => {
        if (context?.allCreatures) {
            setProgeny1(
                context.allCreatures.find(
                    (c) => c?.code === log.progeny1Code && c?.userId === log.progeny1UserId
                ) || null
            );
            setProgeny2(
                context.allCreatures.find(
                    (c) => c?.code === log.progeny2Code && c?.userId === log.progeny2UserId
                ) || null
            );
        }
    }, [context, log.progeny1Code, log.progeny1UserId, log.progeny2Code, log.progeny2UserId]);

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

        const assignedCreatureKeys = new Set(
            context.allLogs
                .filter((l) => l.id !== log.id)
                .flatMap((l) => [
                    l.progeny1Code ? `${l.progeny1UserId}-${l.progeny1Code}` : null,
                    l.progeny2Code ? `${l.progeny2UserId}-${l.progeny2Code}` : null,
                ])
                .filter((key): key is string => !!key)
        );

        return context.allCreatures.filter((c) => {
            if (!c?.species || !possibleSpecies.includes(c.species as any)) return false;
            const creatureKey = `${c.userId}-${c.code}`;
            return !assignedCreatureKeys.has(creatureKey);
        });
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
                    progeny1UserId: progeny1?.userId || null,
                    progeny1Code: progeny1?.code || null,
                    progeny2UserId: progeny2?.userId || null,
                    progeny2Code: progeny2?.code || null,
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
        selectedCreature: EnrichedCreature | null | undefined,
        onValueChange: (creature: EnrichedCreature | null) => void,
        otherSelectedCreature: EnrichedCreature | null | undefined,
        label: string
    ) => (
        <div className="space-y-2">
            <Label>{label}</Label>
            <CreatureCombobox
                creatures={possibleProgeny.filter((c) => c?.id !== otherSelectedCreature?.id)}
                selectedCreatureId={selectedCreature?.id}
                onSelectCreature={(id) =>
                    onValueChange(context?.allCreatures.find((c) => c?.id === id) || null)
                }
                placeholder="Select progeny..."
            />
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson [&>button]:hidden">
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
                                    className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                                />
                            </div>
                            {renderProgenySelect(progeny1, setProgeny1, progeny2, 'Progeny 1')}
                            {renderProgenySelect(progeny2, setProgeny2, progeny1, 'Progeny 2')}
                        </>
                    ) : null}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || isContextLoading}
                        className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
