'use client';

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Trash2, Network } from 'lucide-react';
import type { EnrichedBreedingPair, EnrichedCreature, EnrichedResearchGoal } from '@/types';
import { validatePairing } from '@/lib/breeding-rules-client';
import { CreatureCombobox } from '@/components/misc-custom-components/creature-combobox';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules-client';

type EditBreedingPairFormProps = {
    pair: EnrichedBreedingPair;
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    onSuccess: () => void;
};

export function EditBreedingPairForm({
    pair,
    allCreatures,
    allGoals,
    onSuccess,
}: EditBreedingPairFormProps) {
    const router = useRouter();

    // Initialize state with the existing pair's data
    const [pairName, setPairName] = useState(pair?.pairName);
    const [selectedMale, setSelectedMale] = useState<EnrichedCreature | undefined>(
        pair?.maleParent
    );
    const [selectedFemale, setSelectedFemale] = useState<EnrichedCreature | undefined>(
        pair?.femaleParent
    );
    const [selectedGoalIds, setSelectedGoalIds] = useState(pair?.assignedGoalIds || []);
    const [isInbred, setIsInbred] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [editingWhichParent, setEditingWhichParent] = useState<'male' | 'female' | 'none'>(
        'none'
    );
    const [isHybridMode, setIsHybridMode] = useState(false);

    const {
        availableMales,
        availableFemales,
    }: { availableMales: EnrichedCreature[]; availableFemales: EnrichedCreature[] } =
        useMemo(() => {
            let males = allCreatures.filter((c) => c?.gender === 'male' && c.growthLevel === 3);
            let females = allCreatures.filter((c) => c?.gender === 'female' && c.growthLevel === 3);

            if (editingWhichParent === 'male' && selectedFemale) {
                if (isHybridMode) {
                    males = males.filter(
                        (male) =>
                            validatePairing(male, selectedFemale).isValid ||
                            male?.id === selectedMale?.id
                    );
                } else {
                    males = males.filter(
                        (male) =>
                            male?.species === selectedFemale.species ||
                            male?.id === selectedMale?.id
                    );
                }
                females = females.filter((f) => f?.id === selectedFemale?.id);
            } else if (editingWhichParent === 'female' && selectedMale) {
                if (isHybridMode) {
                    females = females.filter(
                        (female) =>
                            validatePairing(selectedMale, female).isValid ||
                            female?.id === selectedFemale?.id
                    );
                } else {
                    females = females.filter(
                        (female) =>
                            female?.species === selectedMale.species ||
                            female?.id === selectedFemale?.id
                    );
                }
                males = males.filter((m) => m?.id === selectedMale?.id);
            } else if (editingWhichParent === 'none') {
                males = males.filter((m) => m?.id === selectedMale?.id);
                females = females.filter((f) => f?.id === selectedFemale?.id);
            }

            return {
                availableMales: males,
                availableFemales: females,
            };
        }, [editingWhichParent, selectedMale, selectedFemale, allCreatures, isHybridMode]);

    const assignableGoals = useMemo(() => {
        if (!selectedMale?.species || !selectedFemale?.species) return [];
        const possibleOffspring = getPossibleOffspringSpecies(
            selectedMale.species,
            selectedFemale.species
        );
        return allGoals.filter((g) => g?.species && possibleOffspring.includes(g.species as any));
    }, [selectedMale, selectedFemale, allGoals]);

    useEffect(() => {
        if (
            selectedMale?.userId &&
            selectedMale.code &&
            selectedFemale?.userId &&
            selectedFemale.code
        ) {
            const check = async () => {
                try {
                    const response = await fetch('/api/breeding-pairs/check-inbreeding', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            maleKey: { userId: selectedMale.userId, code: selectedMale.code },
                            femaleKey: { userId: selectedFemale.userId, code: selectedFemale.code },
                        }),
                    });
                    if (!response.ok) throw new Error('Failed to check inbreeding status.');
                    const data = await response.json();
                    setIsInbred(data.isInbred);
                } catch (err) {
                    console.error(err);
                }
            };
            check();
        } else {
            setIsInbred(false);
        }
    }, [selectedMale, selectedFemale]);

    useEffect(() => {
        if (editingWhichParent === 'none') {
            setIsHybridMode(false);
        }
    }, [editingWhichParent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!selectedMale || !selectedFemale) {
            setError('Could not find selected parents.');
            setIsLoading(false);
            return;
        }

        if (!selectedMale.species || !selectedFemale.species) {
            setError('Selected parents have missing species data.');
            setIsLoading(false);
            return;
        }
        const possibleOffspring = getPossibleOffspringSpecies(
            selectedMale.species,
            selectedFemale.species
        );
        const species =
            possibleOffspring.length === 1 ? possibleOffspring[0] : selectedMale.species;
        try {
            const response = await fetch(`/api/breeding-pairs/${pair?.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pairName: pairName,
                    species,
                    maleParentUserId: selectedMale.userId,
                    maleParentCode: selectedMale.code,
                    femaleParentUserId: selectedFemale.userId,
                    femaleParentCode: selectedFemale.code,
                    assignedGoalIds: selectedGoalIds,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update pair.');
            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete the pair "${pair?.pairName}"?`))
            return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/breeding-pairs/${pair?.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete pair.');
            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
            <Input
                placeholder="Pair Name"
                value={pairName}
                onChange={(e) => setPairName(e.target.value)}
                className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss"
                required
            />

            {isInbred && (
                <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-200/50 dark:bg-yellow-900/50 dark:text-yellow-300 p-2 text-sm text-dusk-purple">
                    <Network className="h-4 w-4 flex-shrink-0" />
                    <span>
                        This pairing will result in inbred progeny. This does not affect gameplay in
                        TFO.
                    </span>
                </div>
            )}
            <div className="space-y-2">
                <Label>Change Parent</Label>
                <RadioGroup
                    value={editingWhichParent}
                    onValueChange={(value) =>
                        setEditingWhichParent(value as 'male' | 'female' | 'none')
                    }
                    className="flex space-x-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="edit-none" />
                        <Label htmlFor="edit-none" className="font-normal">
                            None
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="edit-male" />
                        <Label htmlFor="edit-male" className="font-normal">
                            Male
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="edit-female" />
                        <Label htmlFor="edit-female" className="font-normal">
                            Female
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {editingWhichParent !== 'none' && (
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                        id="hybrid-mode-edit"
                        checked={isHybridMode}
                        onCheckedChange={(checked) => setIsHybridMode(!!checked)}
                    />
                    <Label htmlFor="hybrid-mode-edit" className="font-normal">
                        Allow Hybrid/Compatible Mates
                    </Label>
                </div>
            )}

            <CreatureCombobox
                creatures={availableMales}
                selectedCreatureId={selectedMale?.id}
                onSelectCreature={(id) => setSelectedMale(allCreatures.find((c) => c?.id === id))}
                placeholder="Select Male Parent..."
                disabled={editingWhichParent !== 'male'}
            />

            <CreatureCombobox
                creatures={availableFemales}
                selectedCreatureId={selectedFemale?.id}
                onSelectCreature={(id) => setSelectedFemale(allCreatures.find((c) => c?.id === id))}
                placeholder="Select Female Parent..."
                disabled={editingWhichParent !== 'female'}
            />

            {assignableGoals.length > 0 && (
                <div className="space-y-2">
                    <Label>Assign Research Goals</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2 bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss">
                        {assignableGoals.map((goal) => (
                            <div key={goal.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`edit-${goal.id}`}
                                    checked={selectedGoalIds.includes(goal.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked)
                                            setSelectedGoalIds((prev) => [...prev, goal.id]);
                                        else
                                            setSelectedGoalIds((prev) =>
                                                prev.filter((id) => id !== goal.id)
                                            );
                                    }}
                                />
                                <Label htmlFor={`edit-${goal.id}`} className="font-normal">
                                    {goal.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-between items-center pt-4">
                <Button
                    type="button"
                    className="text-red-600 border-red-600 bg-barely-lilac border-1"
                    onClick={handleDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                </Button>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={onSuccess}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson	"
                        disabled={isLoading || isDeleting}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
