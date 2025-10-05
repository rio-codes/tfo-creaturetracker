'use client';

import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Network, X, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    Prediction,
    DbBreedingPair,
    DbBreedingLogEntry,
} from '@/types';
import {
    getPossibleOffspringSpecies,
    checkForInbreeding,
    validatePairing,
    speciesList,
} from '@/lib/breeding-rules';
import { CreatureCombobox } from '@/components/misc-custom-components/creature-combobox';

type AddPairFormProps = {
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    baseCreature?: EnrichedCreature | null;
    initialGoal?: EnrichedResearchGoal | null;
    onSuccess: () => void;
};

export function AddPairForm({
    allCreatures,
    allGoals,
    allPairs,
    allLogs,
    baseCreature,
    initialGoal,
    onSuccess,
}: AddPairFormProps) {
    const ParentGeneSummary = ({ creature }: { creature: EnrichedCreature }) => {
        if (!creature?.geneData || creature.geneData.length === 0) {
            return <p className="text-xs text-dusk-purple h-4">&nbsp;</p>; // Keep layout consistent
        }
        const summary = creature.geneData
            .filter((g) => g.category !== 'Gender')
            .map(
                (gene) => `<strong>${gene.category}:</strong> ${gene.phenotype} (${gene.genotype})`
            )
            .join(', ');

        return (
            <p
                className="pt-1 text-xs text-dusk-purple break-words"
                dangerouslySetInnerHTML={{ __html: summary }}
                title={summary.replace(/<strong>/g, '').replace(/<\/strong>/g, '')}
            />
        );
    };

    const router = useRouter();
    const [pairName, setPairName] = useState('');
    const [selectedMaleId, setSelectedMaleId] = useState<string | undefined>(
        baseCreature?.gender === 'male' ? baseCreature.id : undefined
    );
    const [selectedFemaleId, setSelectedFemaleId] = useState<string | undefined>(
        baseCreature?.gender === 'female' ? baseCreature.id : undefined
    );
    const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
    const [isInbred, setIsInbred] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isPredictionLoading, setIsPredictionLoading] = useState(false);
    const [isHybridMode, setIsHybridMode] = useState(false);
    const [selectedSpecies, setSelectedSpecies] = useState('');

    useEffect(() => {
        if (baseCreature) {
            if (baseCreature.gender === 'male') {
                setSelectedMaleId(baseCreature.id);
            } else if (baseCreature.gender === 'female') {
                setSelectedFemaleId(baseCreature.id);
            }
            if (!isHybridMode) {
                setSelectedSpecies(baseCreature.species || '');
            }
        }
        if (initialGoal) {
            setSelectedGoalIds([initialGoal.id]);
        }
    }, [baseCreature, initialGoal, isHybridMode]);

    const { selectedMale, selectedFemale } = useMemo(() => {
        const male = allCreatures.find((c) => c?.id === selectedMaleId);
        const female = allCreatures.find((c) => c?.id === selectedFemaleId);
        return { selectedMale: male, selectedFemale: female };
    }, [selectedMaleId, selectedFemaleId, allCreatures]);

    const existingPartnerIds = useMemo(() => {
        if (!baseCreature) return new Set();
        return new Set(
            allPairs
                .filter(
                    (p) =>
                        p.maleParentId === baseCreature.id || p.femaleParentId === baseCreature.id
                )
                .map((p) =>
                    p.maleParentId === baseCreature.id ? p.femaleParentId : p.maleParentId
                )
        );
    }, [allPairs, baseCreature]);

    const { availableMales, availableFemales } = useMemo(() => {
        let males = allCreatures.filter((c) => c?.gender === 'male' && c.growthLevel === 3);
        let females = allCreatures.filter((c) => c?.gender === 'female' && c.growthLevel === 3);

        if (isHybridMode) {
            if (selectedFemale) {
                males = males.filter(
                    (male) =>
                        validatePairing(male, selectedFemale).isValid || male?.id === selectedMaleId
                );
            }
            if (selectedMale) {
                females = females.filter(
                    (female) =>
                        validatePairing(selectedMale, female).isValid ||
                        female?.id === selectedFemaleId
                );
            }
        } else {
            if (selectedSpecies) {
                males = males.filter((c) => c?.species === selectedSpecies);
                females = females.filter((c) => c?.species === selectedSpecies);
            } else {
                males = [];
                females = [];
            }
        }

        if (baseCreature) {
            males = males.filter((m) => !existingPartnerIds.has(m?.id));
            females = females.filter((f) => !existingPartnerIds.has(f?.id));
        }
        return { availableMales: males, availableFemales: females };
    }, [
        isHybridMode,
        selectedSpecies,
        selectedMale,
        selectedFemale,
        allCreatures,
        selectedMaleId,
        selectedFemaleId,
        existingPartnerIds,
        baseCreature,
    ]);

    const assignableGoals = useMemo(() => {
        if (!selectedMale?.species || !selectedFemale?.species) return [];
        const possibleOffspring = getPossibleOffspringSpecies(
            selectedMale.species,
            selectedFemale.species
        );
        return allGoals.filter((g) => g?.species && possibleOffspring.includes(g.species));
    }, [selectedMale, selectedFemale, allGoals]);
    useEffect(() => {
        if (!selectedMaleId || !selectedFemaleId) {
            setPredictions([]);
            return;
        }
        const fetchPredictions = async () => {
            setIsPredictionLoading(true);
            const goalIds = assignableGoals.map((g) => g.id);
            try {
                const response = await fetch('/api/breeding-predictions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        maleParentId: selectedMaleId,
                        femaleParentId: selectedFemaleId,
                        goalIds,
                    }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                setPredictions(data.predictions);
            } catch (err) {
                console.error(err);
            } finally {
                setIsPredictionLoading(false);
            }
        };
        fetchPredictions();
    }, [selectedMaleId, selectedFemaleId, assignableGoals]);

    useEffect(() => {
        if (selectedMaleId && selectedFemaleId) {
            const inbred = checkForInbreeding(selectedMaleId, selectedFemaleId, allLogs, allPairs);
            setIsInbred(inbred);
        } else {
            setIsInbred(false);
        }
    }, [selectedMaleId, selectedFemaleId, allLogs, allPairs]);

    const handleHybridToggle = (checked: boolean) => {
        setIsHybridMode(checked);
        setSelectedMaleId(baseCreature?.gender === 'male' ? baseCreature.id : undefined);
        setSelectedFemaleId(baseCreature?.gender === 'female' ? baseCreature.id : undefined);
        setSelectedSpecies(!checked && baseCreature ? baseCreature.species || '' : '');
    };

    const handleSpeciesChange = (species: string) => {
        setSelectedSpecies(species);
        setSelectedMaleId(undefined);
        setSelectedFemaleId(undefined);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaleId || !selectedFemaleId) {
            setError(
                `Both a male and a female parent must be selected. ${selectedFemaleId},${selectedMaleId}`
            );
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        const selectedMale = allCreatures.find((c) => c?.id === selectedMaleId);
        const selectedFemale = allCreatures.find((c) => c?.id === selectedFemaleId);

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
        const pairSpecies =
            possibleOffspring.length === 1 ? possibleOffspring[0] : selectedMale.species;

        try {
            const response = await fetch('/api/breeding-pairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pairName,
                    species: pairSpecies,
                    maleParentId: selectedMaleId,
                    femaleParentId: selectedFemaleId,
                    assignedGoalIds: selectedGoalIds,
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'An unknown error occurred while creating the pair.');
                return;
            }

            setMessage(data.message);
            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'A network error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 bg-barely-lilac dark:bg-pompaca-purple">
                <Input
                    placeholder="Pair Name (e.g., Silver Project)"
                    value={pairName}
                    onChange={(e) => setPairName(e.target.value)}
                    className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac"
                    required
                />
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="hybrid-mode"
                        checked={isHybridMode}
                        onCheckedChange={handleHybridToggle}
                    />
                    <Label htmlFor="hybrid-mode">Create Hybrid/Compatible Pair</Label>
                </div>
                {isInbred && (
                    <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-200/50 dark:bg-yellow-900/50 p-2 text-sm text-dusk-purple dark:text-yellow-300">
                        <Network className="h-4 w-4 flex-shrink-0" />
                        <span>
                            This pairing will result in inbred progeny. This does not affect
                            gameplay in TFO.
                        </span>
                    </div>
                )}

                {(selectedMale || selectedFemale) && (
                    <div className="overflow-x-auto">
                        <div className="flex justify-center items-start gap-2 mt-4 p-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50 rounded-lg border text-xs min-w-max">
                            {selectedMale && (
                                <div className="flex flex-col items-center w-36">
                                    <img
                                        src={selectedMale.imageUrl || '/placeholder.png'}
                                        alt={selectedMale.code}
                                        className="w-24 h-24 object-contain bg-blue-100 p-1 border-2 border-pompaca-purple rounded-lg"
                                    />
                                    <Collapsible className="w-full">
                                        <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-left pt-1">
                                            <p className="wrap">
                                                {selectedMale.creatureName || 'Unnamed'} (
                                                {selectedMale.code})
                                            </p>
                                            <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <ParentGeneSummary creature={selectedMale} />
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            )}
                            {selectedMale && selectedFemale && (
                                <X className="text-dusk-purple mt-10" />
                            )}
                            {selectedFemale && (
                                <div className="flex flex-col items-center w-36">
                                    <img
                                        src={selectedFemale.imageUrl || '/placeholder.png'}
                                        alt={selectedFemale.code}
                                        className="w-24 h-24 object-contain bg-pink-100 p-1 border-2 border-pompaca-purple rounded-lg"
                                    />
                                    <Collapsible className="w-full">
                                        <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-left pt-1">
                                            <p className="wrap">
                                                {selectedFemale.creatureName || 'Unnamed'} (
                                                {selectedFemale.code})
                                            </p>
                                            <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <ParentGeneSummary creature={selectedFemale} />
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Select
                    value={selectedSpecies}
                    onValueChange={handleSpeciesChange}
                    required={!isHybridMode}
                    disabled={isHybridMode}
                >
                    <SelectTrigger className="bg-ebena-lavender dark:bg-midnight-purple text-xs">
                        <SelectValue placeholder="Select Species..." />
                    </SelectTrigger>
                    <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple">
                        {speciesList.map((s) => (
                            <SelectItem key={s} value={s} className="w-3/4">
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <CreatureCombobox
                    creatures={availableMales}
                    selectedCreatureId={selectedMaleId}
                    onSelectCreature={setSelectedMaleId}
                    placeholder="Select Male Parent..."
                    disabled={!isHybridMode && !selectedSpecies}
                />

                <CreatureCombobox
                    creatures={availableFemales}
                    selectedCreatureId={selectedFemaleId}
                    onSelectCreature={setSelectedFemaleId}
                    placeholder="Select Female Parent..."
                    disabled={!isHybridMode && !selectedSpecies}
                />

                {isPredictionLoading && (
                    <div className="text-center">
                        <Loader2 className="animate-spin" />
                    </div>
                )}
                {predictions.length > 0 && (
                    <div className="space-y-2 text-sm p-2 border rounded-md bg-ebena-lavender dark:bg-midnight-purple">
                        <h5 className="font-bold">Goal Predictions for this Pairing:</h5>
                        {predictions.map((pred) => (
                            <div key={pred.goalId} className="flex justify-between items-center">
                                <span>{pred.goalName}</span>
                                <div className="flex items-center gap-4">
                                    <span
                                        className={`font-semibold text-xs ${
                                            pred.isPossible ? 'text-green-600' : 'text-red-500'
                                        }`}
                                    >
                                        {pred.isPossible ? 'POSSIBLE' : 'IMPOSSIBLE'}
                                    </span>
                                    <span className="font-mono font-bold w-20 text-right">
                                        {(pred.averageChance * 100).toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {assignableGoals.length > 0 && (
                    <div className="space-y-2">
                        <Label>Assign Research Goals</Label>
                        <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2 bg-ebena-lavender dark:bg-midnight-purple">
                            {assignableGoals.map((goal) => (
                                <div key={goal.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={goal.id}
                                        checked={selectedGoalIds.includes(goal.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedGoalIds((prev) => [...prev, goal.id]);
                                            } else {
                                                setSelectedGoalIds((prev) =>
                                                    prev.filter((id) => id !== goal.id)
                                                );
                                            }
                                        }}
                                    />
                                    <Label htmlFor={goal.id} className="font-normal">
                                        {goal.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}
                {message && <p className="text-sm text-green-600">{error}</p>}
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onSuccess}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-pompaca-purple text-barely-lilac dark:bg-purple-300 dark:text-pompaca-purple"
                >
                    {isLoading ? 'Saving...' : 'Create Pair'}
                </Button>
            </div>
        </form>
    );
}
