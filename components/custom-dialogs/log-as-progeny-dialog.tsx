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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { EnrichedCreature, EnrichedBreedingPair, DbBreedingLogEntry } from '@/types';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules';
import { format } from 'date-fns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type LogAsProgenyDialogProps = {
    children: React.ReactNode;
    creature: EnrichedCreature;
    allCreatures: EnrichedCreature[];
    allEnrichedPairs: EnrichedBreedingPair[];
    allLogs: DbBreedingLogEntry[];
};

export function LogAsProgenyDialog({
    children,
    creature,
    allCreatures,
    allEnrichedPairs,
    allLogs,
}: LogAsProgenyDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [selectedPairId, setSelectedPairId] = useState<string | undefined>();
    const [logAction, setLogAction] = useState<'new' | 'existing'>('new');
    const [selectedLogId, setSelectedLogId] = useState<string | undefined>();
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showWarningDialog, setShowWarningDialog] = useState(false);

    useEffect(() => {
        if (!open) {
            setSelectedPairId(undefined);
            setLogAction('new');
            setSelectedLogId(undefined);
            setNotes('');
            setError('');
        }
    }, [open]);

    let existingLogEntry: DbBreedingLogEntry | null = null;
    let existingPair: EnrichedBreedingPair | null = null;

    if (creature) {
        ({ existingLogEntry, existingPair } = useMemo(() => {
            const log = allLogs.find(
                (l) => l.progeny1Id === creature.id || l.progeny2Id === creature.id
            );
            if (!log) return { existingLogEntry: null, existingPair: null };

            const pair = allEnrichedPairs.find((p) => p.id === log.pairId);
            return { existingLogEntry: log, existingPair: pair || null };
        }, [allLogs, creature.id, allEnrichedPairs]));
    }

    useEffect(() => {
        if (existingPair && !selectedPairId) {
            setSelectedPairId(existingPair.id);
        }
    }, [existingPair, selectedPairId]);

    const suitablePairs = useMemo(() => {
        if (!creature || !creature.species) return [];
        return allEnrichedPairs.filter((pair) => {
            if (!pair?.maleParent?.species || !pair?.femaleParent?.species) {
                return false;
            }
            const possibleOffspring = getPossibleOffspringSpecies(
                pair.maleParent.species,
                pair.femaleParent.species
            );
            return possibleOffspring.includes(creature.species!);
        });
    }, [allEnrichedPairs, creature]);

    const availableLogs = useMemo(() => {
        if (!selectedPairId) return [];
        return allLogs.filter(
            (log) => log.pairId === selectedPairId && (!log.progeny1Id || !log.progeny2Id)
        );
    }, [allLogs, selectedPairId]);

    const getProgenyName = (progenyId: string | null) => {
        if (!progenyId) return 'Empty Slot';
        const progeny = allCreatures.find((c) => c?.id === progenyId);
        return progeny
            ? `${progeny.creatureName || 'Unnamed'} (${progeny.code})`
            : 'Unknown Progeny';
    };

    const performLogOperation = async (keepSourceOnEmpty: boolean) => {
        setIsLoading(true);
        setError('');
        setShowWarningDialog(false);

        const sourceLogId = existingLogEntry ? existingLogEntry.id : undefined;
        try {
            let response;
            if (logAction === 'new') {
                if (!selectedPairId) {
                    setError('Please select a breeding pair.');
                    setIsLoading(false);
                    return;
                }
                const body = {
                    pairId: selectedPairId,
                    progeny1Id: creature?.id,
                    notes: notes || undefined,
                    sourceLogId,
                    keepSourceOnEmpty,
                };
                response = await fetch(`/api/breeding-log`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            } else {
                if (!selectedLogId) {
                    setError('Please select a log entry.');
                    setIsLoading(false);
                    return;
                }
                const body = {
                    logEntryId: selectedLogId,
                    progenyId: creature?.id,
                    sourceLogId,
                    keepSourceOnEmpty,
                };
                response = await fetch(`/api/breeding-log`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to log progeny.');
            }

            router.refresh();
            setOpen(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        const willSourceBecomeEmpty =
            existingLogEntry &&
            (existingLogEntry.progeny1Id === null || existingLogEntry.progeny2Id === null);

        if (willSourceBecomeEmpty) {
            setShowWarningDialog(true);
            return;
        }

        await performLogOperation(false);
    };

    const isSubmitDisabled =
        isLoading || !selectedPairId || (logAction === 'existing' && !selectedLogId);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle>
                            Log &#34;{creature?.creatureName} ({creature?.code})&#34; as Progeny
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="pair-select">
                                {existingPair ? 'Change breeding pair' : 'Select breeding pair'}
                            </Label>
                            <Select value={selectedPairId} onValueChange={setSelectedPairId}>
                                <SelectTrigger
                                    id="pair-select"
                                    className="bg-ebena-lavender dark:bg-midnight-purple"
                                >
                                    <SelectValue placeholder="Choose a pair..." />
                                </SelectTrigger>
                                <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple">
                                    {suitablePairs.length > 0 ? (
                                        suitablePairs.map((pair) => (
                                            <SelectItem key={pair.id} value={pair.id}>
                                                {pair.pairName} ({pair.maleParent?.code} x{' '}
                                                {pair.femaleParent?.code})
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="none" disabled>
                                            No suitable pairs found
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedPairId && (
                            <div className="space-y-4 rounded-md border p-4 bg-ebena-lavender/50 dark:bg-midnight-purple/50">
                                <RadioGroup
                                    value={logAction}
                                    onValueChange={(v) => setLogAction(v as 'new' | 'existing')}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="new" id="r-new" />
                                        <Label htmlFor="r-new">Create a new log entry</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="existing" id="r-existing" />
                                        <Label htmlFor="r-existing">
                                            Add to an existing log entry
                                        </Label>
                                    </div>
                                </RadioGroup>

                                {logAction === 'new' && (
                                    <div className="space-y-2 pl-6">
                                        <Label htmlFor="notes">Notes (Optional)</Label>
                                        <Textarea
                                            id="notes"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Any notes about this breeding event..."
                                            className="bg-ebena-lavender dark:bg-midnight-purple"
                                        />
                                    </div>
                                )}

                                {logAction === 'existing' && (
                                    <div className="space-y-2 pl-6">
                                        <Label htmlFor="log-select">Select Log Entry</Label>
                                        <Select
                                            value={selectedLogId}
                                            onValueChange={setSelectedLogId}
                                        >
                                            <SelectTrigger
                                                id="log-select"
                                                className="bg-ebena-lavender dark:bg-midnight-purple"
                                            >
                                                <SelectValue placeholder="Choose a log..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple">
                                                {availableLogs.length > 0 ? (
                                                    availableLogs.map((log) => (
                                                        <SelectItem
                                                            key={log.id}
                                                            value={log.id}
                                                            className="whitespace-normal"
                                                        >
                                                            {format(
                                                                new Date(log.createdAt),
                                                                'MM/dd/yy pp'
                                                            )}{' '}
                                                            ({getProgenyName(log.progeny1Id)},{' '}
                                                            {getProgenyName(log.progeny2Id)})
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="none" disabled>
                                                        No available log entries
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac"
                                type="button"
                                variant="ghost"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac"
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Log Progeny
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
                <AlertDialogContent className="bg-barely-lilac dark:bg-pompaca-purple">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Empty Log Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Moving this progeny will leave the original log entry empty. Do you want
                            to delete the old entry, or keep it to edit its notes?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
                        <AlertDialogCancel>Cancel Move</AlertDialogCancel>
                        <Button
                            className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac"
                            variant="outline"
                            onClick={() => performLogOperation(true)}
                        >
                            Move and Keep Old Entry
                        </Button>
                        <AlertDialogAction
                            onClick={() => performLogOperation(false)}
                            className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac"
                        >
                            Move and Delete Old Entry
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
