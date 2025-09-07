'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Loader2, Network, X } from 'lucide-react';
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
    const router = useRouter();
    const [pairName, setPairName] = useState('');
    const [selectedMaleId, setSelectedMaleId] = useState<string | undefined>(
        baseCreature?.gender === 'male' ? baseCreature.id : undefined
    );
    const [selectedFemaleId, setSelectedFemaleId] = useState<
        string | undefined
    >(baseCreature?.gender === 'female' ? baseCreature.id : undefined);
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
    }, [baseCreature, initialGoal]);

    const { selectedMale, selectedFemale } = useMemo(() => {
        const male = allCreatures.find((c) => c?.id === selectedMaleId);
        const female = allCreatures.find((c) => c?.id === selectedFemaleId);
        return { selectedMale: male, selectedFemale: female };
    }, [selectedMaleId, selectedFemaleId, allCreatures]);

    const { availableMales, availableFemales } = useMemo(() => {
        const allAdultMales = allCreatures.filter(
            (c) => c.gender === 'male' && c.growthLevel === 3
        );
        const allAdultFemales = allCreatures.filter(
            (c) => c.gender === 'female' && c.growthLevel === 3
        );

        if (isHybridMode) {
            // Hybrid mode: show all valid mates
            if (selectedMale) {
                const validFemales = allAdultFemales.filter(
                    (female) => validatePairing(selectedMale, female).isValid
                );
                return {
                    availableMales: allAdultMales,
                    availableFemales: validFemales,
                };
            }

            if (selectedFemale) {
                const validMales = allAdultMales.filter(
                    (male) => validatePairing(male, selectedFemale).isValid
                );
                return {
                    availableMales: validMales,
                    availableFemales: allAdultFemales,
                };
            }

            return {
                availableMales: allAdultMales,
                availableFemales: allAdultFemales,
            };
        } else {
            // Standard mode: filter by selected species
            if (!selectedSpecies) {
                return { availableMales: [], availableFemales: [] };
            }
            const malesOfSpecies = allAdultMales.filter(
                (c) => c.species === selectedSpecies
            );
            const femalesOfSpecies = allAdultFemales.filter(
                (c) => c.species === selectedSpecies
            );
            return {
                availableMales: malesOfSpecies,
                availableFemales: femalesOfSpecies,
            };
        }
    }, [
        isHybridMode,
        selectedSpecies,
        selectedMale,
        selectedFemale,
        allCreatures,
    ]);

    const assignableGoals = useMemo(() => {
        if (!selectedMale || !selectedFemale) return [];
        const possibleOffspring = getPossibleOffspringSpecies(
            selectedMale.species!,
            selectedFemale.species!
        );
        return allGoals.filter(
            (g) => g && possibleOffspring.includes(g.species!)
        );
    }, [selectedMale, selectedFemale, allGoals]);
    useEffect(() => {
        if (!selectedMaleId || !selectedFemaleId) {
            setPredictions([]);
            return;
        }
        const fetchPredictions = async () => {
            setIsPredictionLoading(true);
            const goalIds = assignableGoals.map((g) => g?.id);
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
            const inbred = checkForInbreeding(
                selectedMaleId,
                selectedFemaleId,
                allLogs,
                allPairs
            );
            setIsInbred(inbred);
        } else {
            setIsInbred(false);
        }
    }, [selectedMaleId, selectedFemaleId, allLogs, allPairs]);

    const handleHybridToggle = (checked: boolean) => {
        setIsHybridMode(checked);
        // Reset selections when toggling mode
        setSelectedMaleId(
            baseCreature?.gender === 'male' ? baseCreature.id : undefined
        );
        setSelectedFemaleId(
            baseCreature?.gender === 'female' ? baseCreature.id : undefined
        );
        setSelectedSpecies(
            !checked && baseCreature ? baseCreature.species || '' : ''
        );
    };

    const handleSpeciesChange = (species: string) => {
        setSelectedSpecies(species);
        setSelectedMaleId(undefined);
        setSelectedFemaleId(undefined);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaleId || !selectedFemaleId) {
            setError('Both a male and a female parent must be selected.');
            return;
        }
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/breeding-pairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pairName,
                    species: isHybridMode
                        ? selectedMale?.species
                        : selectedSpecies,
                    maleParentId: selectedMaleId,
                    femaleParentId: selectedFemaleId,
                    assignedGoalIds: selectedGoalIds,
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.error ||
                        'An unknown error occurred while creating the pair.'
                );
                return;
            }

            // on success, show message, refresh data, and close the dialog
            setMessage(data.message);
            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(
                err.message || 'A network error occurred. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-barely-lilac dark:bg-pompaca-purple dark"
        >
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
                <Label htmlFor="hybrid-mode">
                    Create Hybrid/Compatible Pair
                </Label>
            </div>
            {isInbred && (
                <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-200/50 p-2 text-sm text-pompaca-purple">
                    <Network className="h-4 w-4 flex-shrink-0" />
                    <span>
                        This pairing is inbred. This does not affect gameplay.
                    </span>
                </div>
            )}

            {/* Pair Preview */}
            {(selectedMale || selectedFemale) && (
                <div className="flex justify-center items-center gap-2 mt-4 p-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50 rounded-lg border">
                    {selectedMale && (
                        <img
                            src={selectedMale.imageUrl}
                            alt={selectedMale.code}
                            className="w-24 h-24 object-contain bg-blue-100 p-1 border-2 border-pompaca-purple rounded-lg"
                        />
                    )}
                    {selectedMale && selectedFemale && (
                        <X className="text-dusk-purple" />
                    )}
                    {selectedFemale && (
                        <img
                            src={selectedFemale.imageUrl}
                            alt={selectedFemale.code}
                            className="w-24 h-24 object-contain bg-pink-100 p-1 border-2 border-pompaca-purple rounded-lg"
                        />
                    )}
                </div>
            )}

            <Select
                value={selectedSpecies}
                onValueChange={handleSpeciesChange}
                required={!isHybridMode}
                disabled={isHybridMode}
            >
                <SelectTrigger className="bg-ebena-lavender dark:bg-midnight-purple">
                    <SelectValue placeholder="Select Species..." />
                </SelectTrigger>
                <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple">
                    {speciesList.map((s) => (
                        <SelectItem key={s} value={s}>
                            {s}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Parent Selectors */}
            <Select
                value={selectedMaleId}
                onValueChange={setSelectedMaleId}
                disabled={!isHybridMode && !selectedSpecies}
            >
                <SelectTrigger className="bg-ebena-lavender dark:bg-midnight-purple">
                    <SelectValue placeholder="Select Male Parent..." />
                </SelectTrigger>
                <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple">
                    {availableMales.map((c) => (
                        <SelectItem key={c?.id} value={c!.id}>
                            {c?.creatureName || 'Unnamed'} ({c?.code}) -{' '}
                            {c.species}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={selectedFemaleId}
                onValueChange={setSelectedFemaleId}
                disabled={!isHybridMode && !selectedSpecies}
            >
                <SelectTrigger className="bg-ebena-lavender dark:bg-midnight-purple">
                    <SelectValue placeholder="Select Female Parent..." />
                </SelectTrigger>
                <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple">
                    {availableFemales.map((c) => (
                        <SelectItem key={c?.id} value={c!.id}>
                            {c?.creatureName || 'Unnamed'} ({c?.code}) -{' '}
                            {c.species}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Prediction Display */}
            {isPredictionLoading && (
                <div className="text-center">
                    <Loader2 className="animate-spin" />
                </div>
            )}
            {predictions.length > 0 && (
                <div className="space-y-2 text-sm p-2 border rounded-md bg-ebena-lavender dark:bg-midnight-purple">
                    <h5 className="font-bold">
                        Goal Predictions for this Pairing:
                    </h5>
                    {predictions.map((pred) => (
                        <div
                            key={pred.goalId}
                            className="flex justify-between items-center"
                        >
                            <span>{pred.goalName}</span>
                            <div className="flex items-center gap-4">
                                <span
                                    className={`font-semibold text-xs ${
                                        pred.isPossible
                                            ? 'text-green-600'
                                            : 'text-red-500'
                                    }`}
                                >
                                    {pred.isPossible
                                        ? 'POSSIBLE'
                                        : 'IMPOSSIBLE'}
                                </span>
                                <span className="font-mono font-bold w-20 text-right">
                                    {(pred.averageChance * 100).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Goal Selector (Multi-select) */}
            {assignableGoals.length > 0 && (
                <div className="space-y-2">
                    <Label>Assign Research Goals</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2 bg-ebena-lavender dark:bg-midnight-purple">
                        {assignableGoals.map((goal) => (
                            <div
                                key={goal?.id}
                                className="flex items-center space-x-2"
                            >
                                <Checkbox
                                    id={goal!.id}
                                    checked={selectedGoalIds.includes(goal!.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedGoalIds((prev) => [
                                                ...prev,
                                                goal!.id,
                                            ]);
                                        } else {
                                            setSelectedGoalIds((prev) =>
                                                prev.filter(
                                                    (id) => id !== goal!.id
                                                )
                                            );
                                        }
                                    }}
                                />
                                <Label
                                    htmlFor={goal!.id}
                                    className="font-normal"
                                >
                                    {goal!.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-green-600">{error}</p>}
            <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-pompaca-purple text-barely-lilac"
            >
                {isLoading ? 'Saving...' : 'Create Pair'}
            </Button>
        </form>
    );
}
