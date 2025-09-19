'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type {
    EnrichedCreature,
    EnrichedBreedingPair,
    DbBreedingLogEntry,
    SerializedBreedingLogEntry,
} from '@/types';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules';

type EditLogDialogProps = {
    children: React.ReactNode;
    log: SerializedBreedingLogEntry;
    pair: EnrichedBreedingPair;
    allCreatures: EnrichedCreature[];
    allLogs: DbBreedingLogEntry[];
};

export function EditLogDialog({ children, log, pair, allCreatures, allLogs }: EditLogDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState(log.notes || '');
    const [progeny1Id, setProgeny1Id] = useState<string | null>(log.progeny1Id);
    const [progeny2Id, setProgeny2Id] = useState<string | null>(log.progeny2Id);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setNotes(log.notes || '');
            setProgeny1Id(log.progeny1Id);
            setProgeny2Id(log.progeny2Id);
            setError('');
            setIsLoading(false);
        }
    }, [open, log]);

    const possibleProgeny = useMemo(() => {
        if (
            !pair.maleParent ||
            !pair.femaleParent ||
            !pair.maleParent.species ||
            !pair.femaleParent.species
        )
            return [];
        const possibleSpecies = getPossibleOffspringSpecies(
            pair.maleParent.species,
            pair.femaleParent.species
        );

        const assignedCreatureIds = new Set(
            allLogs
                .filter((l) => l.id !== log.id) // Exclude current log from check
                .flatMap((l) => [l.progeny1Id, l.progeny2Id])
                .filter(Boolean)
        );

        return allCreatures.filter(
            (c) =>
                c?.species && possibleSpecies.includes(c.species) && !assignedCreatureIds.has(c.id)
        );
    }, [allCreatures, allLogs, pair, log.id]);

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
            <Select
                value={selectedValue || 'none'}
                onValueChange={(v) => onValueChange(v === 'none' ? null : v)}
            >
                <SelectTrigger className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac">
                    <SelectValue placeholder="Select progeny..." />
                </SelectTrigger>
                <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac">
                    <SelectItem value="none">None</SelectItem>
                    {possibleProgeny
                        .filter((c) => c?.id !== otherSelectedId)
                        .map((c) => (
                            <SelectItem key={c?.id} value={c!.id}>
                                {c?.creatureName || 'Unnamed'} ({c?.code})
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac dark:bg-pompaca-purple text-pompaca-purple dark:text-barely-lilac [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle>Edit Log Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
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
                    {renderProgenySelect(progeny1Id, setProgeny1Id, progeny2Id, 'Progeny 1')}
                    {renderProgenySelect(progeny2Id, setProgeny2Id, progeny1Id, 'Progeny 2')}
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
                        disabled={isLoading}
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
