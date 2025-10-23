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

type ProgenyContextData = {
    existingLogEntry: DbBreedingLogEntry | null;
    existingPair: EnrichedBreedingPair | null;
    suitablePairs: EnrichedBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    allCreatures: EnrichedCreature[];
};

type LogAsProgenyDialogProps = {
    children: React.ReactNode;
    creature: EnrichedCreature;
};

export function LogAsProgenyDialog({ children, creature }: LogAsProgenyDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [context, setContext] = useState<ProgenyContextData | null>(null);
    const [isContextLoading, setIsContextLoading] = useState(false);

    const [selectedPairId, setSelectedPairId] = useState<string | undefined>();
    const [logAction, setLogAction] = useState<'new' | 'existing'>('new');
    const [selectedLogId, setSelectedLogId] = useState<string | undefined>();
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showWarningDialog, setShowWarningDialog] = useState(false);

    useEffect(() => {
        if (!open) {
            // Reset state on close
            setContext(null);
            setSelectedPairId(undefined);
            setLogAction('new');
            setSelectedLogId(undefined);
            setNotes('');
            setError('');
        } else if (open && !context) {
            // Fetch context on open
            const fetchContext = async () => {
                setIsContextLoading(true);
                try {
                    const response = await fetch(`/api/creatures/${creature?.id}/progeny-context`);
                    if (!response.ok) {
                        throw new Error('Failed to load data for logging progeny.');
                    }
                    const data: ProgenyContextData = await response.json();
                    setContext(data);
                    if (data.existingPair) {
                        setSelectedPairId(data.existingPair.id);
                    }
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsContextLoading(false);
                }
            };
            fetchContext();
        }
    }, [open, context, creature?.id]);

    const { existingLogEntry, existingPair, suitablePairs, allLogs, allCreatures } = useMemo(
        () => ({
            existingLogEntry: context?.existingLogEntry ?? null,
            existingPair: context?.existingPair ?? null,
            suitablePairs: context?.suitablePairs ?? [],
            allLogs: context?.allLogs ?? [],
            allCreatures: context?.allCreatures ?? [],
        }),
        [context]
    );

    useEffect(() => {
        if (existingPair && !selectedPairId) {
            setSelectedPairId(existingPair.id);
        }
    }, [existingPair, selectedPairId]);

    const availableLogs = useMemo(() => {
        if (!selectedPairId) return [];
        return allLogs.filter(
            (log) => log.pairId === selectedPairId && (!log.progeny1Code || !log.progeny2Code)
        );
    }, [allLogs, selectedPairId]);

    const getProgenyName = (key: { userId: string | null; code: string | null }) => {
        if (!key.userId || !key.code) return 'Empty Slot';
        const progeny = allCreatures.find((c) => c?.userId === key.userId && c?.code === key.code);
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
                    progeny1UserId: creature?.userId,
                    progeny1Code: creature?.code,
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
                    progenyUserId: creature?.userId,
                    progenyCode: creature?.code,
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
            (existingLogEntry.progeny1Code === null || existingLogEntry.progeny2Code === null);

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
                <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle>
                            Log &#34;{creature?.creatureName} ({creature?.code})&#34; as Progeny
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 min-h-[300px]">
                        {isContextLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-pompaca-purple" />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="pair-select">
                                        {existingPair
                                            ? 'Change breeding pair'
                                            : 'Select breeding pair'}
                                    </Label>
                                    <Select
                                        value={selectedPairId}
                                        onValueChange={setSelectedPairId}
                                    >
                                        <SelectTrigger
                                            id="pair-select"
                                            className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss"
                                        >
                                            <SelectValue placeholder="Choose a pair..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss">
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
                                    <div className="space-y-4 rounded-md border p-4 bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-midnight-purple hallowsnight:bg-abyss/50">
                                        <RadioGroup
                                            value={logAction}
                                            onValueChange={(v: 'new' | 'existing') =>
                                                setLogAction(v as 'new' | 'existing')
                                            }
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="new" id="r-new" />
                                                <Label htmlFor="r-new">
                                                    Create a new log entry
                                                </Label>
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
                                                    className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss"
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
                                                        className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss"
                                                    >
                                                        <SelectValue placeholder="Choose a log..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss">
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
                                                                    (
                                                                    {getProgenyName({
                                                                        userId: log.progeny1UserId,
                                                                        code: log.progeny1Code,
                                                                    })}
                                                                    ,{' '}
                                                                    {getProgenyName({
                                                                        userId: log.progeny2UserId,
                                                                        code: log.progeny2Code,
                                                                    })}
                                                                    )
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
                            </>
                        )}
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                                type="button"
                                variant="ghost"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
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
                <AlertDialogContent className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet">
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
                            className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                            variant="outline"
                            onClick={() => performLogOperation(true)}
                        >
                            Move and Keep Old Entry
                        </Button>
                        <AlertDialogAction
                            onClick={() => performLogOperation(false)}
                            className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                        >
                            Move and Delete Old Entry
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
