'use client';

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash2, Loader2, X, ChevronDown, Network } from 'lucide-react';
import type {
    EnrichedBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
    Prediction,
} from '@/types';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules-client';
import { CreatureCombobox } from '@/components/misc-custom-components/creature-combobox';

type ManagePairsFormProps = {
    baseCreature: EnrichedCreature;
    existingPairs: EnrichedBreedingPair[];
    suitableMates: EnrichedCreature[];
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    onActionCompleteAction: () => void;
};

export function ManageBreedingPairsForm({
    baseCreature,
    existingPairs,
    suitableMates,
    allCreatures,
    allGoals,
    onActionCompleteAction: onActionComplete,
}: ManagePairsFormProps) {
    const router = useRouter();
    const [newPairName, setNewPairName] = useState('');
    const [selectedMateId, setSelectedMateId] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isInbred, setIsInbred] = useState(false);
    const [error, setError] = useState('');
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isPredictionLoading, setIsPredictionLoading] = useState(false);

    const { maleParent, femaleParent } = useMemo(() => {
        if (!selectedMateId) {
            return { maleParent: null, femaleParent: null };
        }
        const mate = allCreatures.find((c) => c?.id === selectedMateId);
        if (!mate) return { maleParent: null, femaleParent: null };
        if (baseCreature?.gender === 'male') {
            return { maleParent: baseCreature, femaleParent: mate };
        }
        return { maleParent: mate, femaleParent: baseCreature };
    }, [baseCreature, selectedMateId, allCreatures]);

    const relevantGoals = useMemo(() => {
        const selectedMate = allCreatures.find((c) => c?.id === selectedMateId);
        if (!selectedMate?.species || !baseCreature?.species) {
            return allGoals.filter((g) => g?.species === baseCreature?.species);
        }
        const possibleOffspring = getPossibleOffspringSpecies(
            baseCreature.species,
            selectedMate.species
        );
        return allGoals.filter((g) => g?.species && possibleOffspring.includes(g.species as any));
    }, [allGoals, baseCreature, selectedMateId, allCreatures]);

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
                className="pt-1 text-xs text-dusk-purple wrap-break-word"
                dangerouslySetInnerHTML={{ __html: summary }}
                title={summary.replace(/<strong>/g, '').replace(/<\/strong>/g, '')}
            />
        );
    };

    useEffect(() => {
        if (!selectedMateId) {
            setPredictions([]);
            return;
        }

        const fetchPredictions = async () => {
            setIsPredictionLoading(true);
            const goalIds = relevantGoals.map((g) => g.id);

            try {
                const response = await fetch('/api/breeding-predictions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        maleParentUserId: maleParent?.userId,
                        maleParentCode: maleParent?.code,
                        femaleParentUserId: femaleParent?.userId,
                        femaleParentCode: femaleParent?.code,
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
    }, [selectedMateId, baseCreature, relevantGoals, maleParent, femaleParent]);

    useEffect(() => {
        const male = maleParent;
        const female = femaleParent;

        if (male && female) {
            const check = async () => {
                try {
                    const response = await fetch('/api/breeding-pairs/check-inbreeding', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            maleKey: { userId: male.userId, code: male.code },
                            femaleKey: { userId: female.userId, code: female.code },
                        }),
                    });
                    if (!response.ok) {
                        throw new Error('Failed to check inbreeding status.');
                    }
                    const data = await response.json();
                    setIsInbred(data.isInbred);
                } catch (err) {
                    console.error(err);
                    // You could add a toast notification here for the user
                }
            };
            check();
        } else {
            setIsInbred(false);
        }
    }, [maleParent, femaleParent]);

    const handleCreatePair = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMateId) return;
        setIsLoading(true);
        setError('');

        try {
            const selectedMate = allCreatures.find((c) => c?.id === selectedMateId);
            if (!selectedMate) {
                setError('Selected mate not found.');
                setIsLoading(false);
                return;
            }

            if (!baseCreature?.species || !selectedMate.species) {
                setError('Parent species data is missing.');
                setIsLoading(false);
                return;
            }
            const possibleOffspring = getPossibleOffspringSpecies(
                baseCreature?.species,
                selectedMate.species
            );
            const pairSpecies =
                possibleOffspring.length === 1 ? possibleOffspring[0] : baseCreature.species;

            const response = await fetch('/api/breeding-pairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pairName: newPairName || `${baseCreature.code} & ${selectedMate.code}`,
                    species: pairSpecies,
                    maleParentUserId: maleParent?.userId,
                    maleParentCode: maleParent?.code,
                    femaleParentUserId: femaleParent?.userId,
                    femaleParentCode: femaleParent?.code,
                }),
            });
            if (!response.ok) throw new Error('Failed to create pair.');
            router.refresh();
            onActionComplete();
            setNewPairName('');
            setSelectedMateId(undefined);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemovePair = async (pairId: string) => {
        if (!window.confirm('Are you sure you want to remove this pair?')) return;
        setIsLoading(true);
        try {
            await fetch(`/api/breeding-pairs/${pairId}`, { method: 'DELETE' });
            router.refresh();
            onActionComplete();
        } catch (err: any) {
            console.error(err);
            alert('Failed to remove pair.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-bold text-pompaca-purple dark-text-purple-300 hallowsnight:text-cimo-crimson mb-2">
                    Existing Pairs
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                    {existingPairs.filter((p) => !p.isArchived).length > 0 ? (
                        existingPairs
                            .filter((p) => !p.isArchived)
                            .map((pair) => (
                                <div
                                    key={pair.id}
                                    className="flex items-center justify-between bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss p-2 rounded-md"
                                >
                                    <span className="text-ellipsis">{pair.pairName}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemovePair(pair.id)}
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))
                    ) : (
                        <p className="text-sm text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                            This creature is not in any pairs.
                        </p>
                    )}
                </div>
            </div>

            <div>
                <h4 className="font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson b-2">
                    Create New Pair
                </h4>
                <form onSubmit={handleCreatePair} className="space-y-4">
                    <Input
                        placeholder="New Pair Name (Optional)"
                        value={newPairName}
                        onChange={(e) => setNewPairName(e.target.value)}
                        className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss"
                    />
                    <CreatureCombobox
                        creatures={suitableMates}
                        selectedCreatureId={selectedMateId}
                        onSelectCreature={setSelectedMateId}
                        placeholder="Select a mate..."
                    />

                    {selectedMateId && (
                        <>
                            {isInbred && (
                                <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-200/50 dark:bg-yellow-900/50 p-2 text-sm text-dusk-purple dark:text-yellow-300">
                                    <Network className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                        This pairing will result in inbred progeny. This does not
                                        affect gameplay in TFO.
                                    </span>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <div className="flex justify-center items-start gap-2 mt-4 p-4 bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-pompaca-purple rounded-lg border min-w-max">
                                    {maleParent && (
                                        <div className="flex flex-col items-center w-36">
                                            <img
                                                src={maleParent.imageUrl || '/placeholder.png'}
                                                alt={maleParent.code}
                                                className="w-24 h-24 object-contain bg-blue-100 p-1 border-2 border-pompaca-purple rounded-lg"
                                            />
                                            <Collapsible className="w-full">
                                                <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-left pt-1">
                                                    <p className="text-ellipsis">
                                                        {maleParent.creatureName || 'Unnamed'} (
                                                        {maleParent.code}) (G{maleParent.generation}
                                                        )
                                                    </p>
                                                    <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <ParentGeneSummary creature={maleParent} />
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>
                                    )}
                                    {maleParent && femaleParent && (
                                        <X className="text-dusk-purple mt-10 hallowsnight:text-cimo-crimson" />
                                    )}
                                    {femaleParent && (
                                        <div className="flex flex-col items-center w-36">
                                            <img
                                                src={femaleParent.imageUrl || '/placeholder.png'}
                                                alt={femaleParent.code}
                                                className="w-24 h-24 object-contain bg-pink-100 p-1 border-2 border-pompaca-purple hallowsnight:border-blood-bay-wine rounded-lg"
                                            />
                                            <Collapsible className="w-full">
                                                <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-left pt-1">
                                                    <p className="text-ellipsis">
                                                        {femaleParent.creatureName || 'Unnamed'} (
                                                        {femaleParent.code}) (G
                                                        {femaleParent.generation})
                                                    </p>
                                                    <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <ParentGeneSummary creature={femaleParent} />
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {isPredictionLoading && (
                        <div className="text-center">
                            <Loader2 className="animate-spin" />
                        </div>
                    )}
                    {predictions.length > 0 && (
                        <div className="space-y-2 text-sm p-2 border rounded-md bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss">
                            <h5 className="font-bold">Goal Predictions for this Pairing:</h5>
                            {predictions.map((pred) => (
                                <div
                                    key={pred.goalId}
                                    className="flex justify-between items-center"
                                >
                                    <span>{pred.goalName}</span>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`font-bold text-xs ${
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

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button
                        type="button"
                        onClick={onActionComplete}
                        variant="outline"
                        className="w-full border-pompaca-purple text-pompaca-purple hover:bg-pompaca-purple/10 dark:border-purple-400 dark:text-purple-400 hallowsnight:text-cimo-crimson hallowsnight:border-cimo-crimson hallowsnight:border-abyss dark:hover:bg-purple-400/10"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        disabled={isLoading || !selectedMateId}
                        className="w-full bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Create Pair'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
