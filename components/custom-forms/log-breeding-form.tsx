'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { EnrichedCreature } from '@/types';
import { CreatureCombobox } from '@/components/misc-custom-components/creature-combobox';
import { getPossibleOffspringSpecies } from '@/lib/genetics';

type LogBreedingFormProps = {
    allCreatures: EnrichedCreature[];
    pair: { id: string | undefined; maleParent: EnrichedCreature; femaleParent: EnrichedCreature };
    onSuccess: () => void;
};
export function LogBreedingForm({ pair, allCreatures, onSuccess }: LogBreedingFormProps) {
    const router = useRouter();
    const [progeny1Id, setProgeny1Id] = useState<string | null>(null);
    const [progeny2Id, setProgeny2Id] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const potentialProgeny = useMemo(() => {
        if (!pair.maleParent?.species || !pair.femaleParent?.species) {
            return [];
        }
        const possibleSpecies = getPossibleOffspringSpecies(
            pair.maleParent.species,
            pair.femaleParent.species
        );
        return allCreatures.filter((c) => c?.species && possibleSpecies.includes(c.species as any));
    }, [allCreatures, pair.maleParent, pair.femaleParent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const progeny1 = allCreatures.find((c) => c?.id === progeny1Id);
        const progeny2 = allCreatures.find((c) => c?.id === progeny2Id);
        try {
            const response = await fetch('/api/breeding-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pairId: pair!.id,
                    // Use the userId and code from the found creature objects
                    progeny1UserId: progeny1?.userId || null,
                    progeny1Code: progeny1?.code || null,
                    progeny2UserId: progeny2?.userId || null,
                    progeny2Code: progeny2?.code || null,
                    notes,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to log event.');

            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Progeny 1 (Optional)</Label>
                <CreatureCombobox
                    creatures={potentialProgeny.filter((p) => p?.id !== progeny2Id)}
                    selectedCreatureId={progeny1Id ?? undefined} // Change here
                    onSelectCreature={(id) => setProgeny1Id(id ?? null)} // Change here
                    placeholder="Select first offspring..."
                />
            </div>

            <div>
                <Label>Progeny 2 (Optional)</Label>
                <CreatureCombobox
                    creatures={potentialProgeny.filter((p) => p?.id !== progeny1Id)}
                    selectedCreatureId={progeny2Id ?? undefined} // Change here
                    onSelectCreature={(id) => setProgeny2Id(id ?? null)} // Change here
                    placeholder="Select second offspring..."
                />
            </div>

            <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss"
                    placeholder="Add any notes about this breeding event..."
                />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onSuccess}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Save Log Entry'}
                </Button>
            </div>
        </form>
    );
}
