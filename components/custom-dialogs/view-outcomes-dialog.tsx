'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import type { EnrichedBreedingPair } from '@/types';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';

import { getPossibleOffspringSpecies } from '@/lib/breeding-rules';

type Outcome = {
    genotype: string;
    phenotype: string;
    probability: number;
};

type OutcomesByCategory = {
    [category: string]: Outcome[];
};

export function ViewOutcomesDialog({
    children,
    pair,
}: {
    children: React.ReactNode;
    pair: EnrichedBreedingPair;
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [outcomes, setOutcomes] = useState<OutcomesByCategory | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // Holds the "canonical" URL for the most-likely outcome for this dialog session. Starts null.
    const [defaultPreviewUrl, setDefaultPreviewUrl] = useState<string | null>(null);
    // Holds the currently displayed URL, which can change based on selection. Starts null.
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedGenotypes, setSelectedGenotypes] = useState<{
        [key: string]: string;
    }>({});
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [newGoalName, setNewGoalName] = useState('');
    const [isSavingGoal, setIsSavingGoal] = useState(false);
    const [possibleOffspringSpecies, setPossibleOffspringSpecies] = useState<string[]>([]);
    const [goalMode, setGoalMode] = useState<'phenotype' | 'genotype'>('phenotype');
    const [optionalGenes, setOptionalGenes] = useState<Record<string, boolean>>({});

    const isCrossBreed = useMemo(() => {
        return pair.maleParent?.species !== pair.femaleParent?.species;
    }, [pair]);

    // Helper function to fetch and set a new preview image, wrapped in useCallback.
    const updatePreviewImage = useCallback(
        async (genotypes: { [key: string]: string }) => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/breeding-pairs/${pair.id}/outcomes-preview`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ selectedGenotypes: genotypes }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const newUrl = `${data.imageUrl}?v=${new Date().getTime()}`;
                    setPreviewUrl(newUrl);
                    return newUrl; // Return for setting the default URL
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
            return null;
        },
        [pair.id]
    );

    const handleSaveAsGoal = async () => {
        if (!newGoalName.trim()) {
            // Optionally show a toast error
            return;
        }
        setIsSavingGoal(true);

        try {
            const response = await fetch('/api/research-goals/from-outcomes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goalName: newGoalName,
                    species: pair.species,
                    pairId: pair.id,
                    selectedGenotypes: selectedGenotypes,
                    goalMode: goalMode,
                    optionalGenes: optionalGenes,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save goal.');
            }
            const data = await response.json();

            setShowSaveDialog(false);
            setIsOpen(false);
            router.refresh();

            if (data.goalId) {
                router.push(`/research-goals/${data.goalId}`);
            }
        } catch (error: any) {
            alert(error.message); // Replace with a toast notification for better UX
        } finally {
            setIsSavingGoal(false);
        }
    };

    const mostLikelyGenotypes = useMemo(() => {
        if (!outcomes) return {};
        const result: { [key: string]: string } = {};
        for (const category in outcomes) {
            result[category] = outcomes[category][0].genotype;
        }
        return result;
    }, [outcomes]);

    useEffect(() => {
        if (showSaveDialog) {
            setOptionalGenes({});
            setGoalMode('phenotype');
        }
    }, [showSaveDialog]);

    useEffect(() => {
        // Reset state when dialog is closed to ensure fresh data on reopen
        if (!isOpen) {
            setOutcomes(null); // This will trigger a re-fetch on next open
            return;
        }

        const offspringSpecies = getPossibleOffspringSpecies(
            pair.maleParent!.species!,
            pair.femaleParent!.species!
        );
        setPossibleOffspringSpecies(offspringSpecies);
        if (isCrossBreed) {
            return; // For cross-breeds, we don't fetch detailed outcomes yet.
        }

        // This effect runs once when the dialog opens to fetch all necessary data.
        if (!outcomes) {
            const fetchInitialData = async () => {
                setIsLoading(true);
                try {
                    const outcomesResponse = await fetch(`/api/breeding-pairs/${pair.id}/outcomes`);
                    if (!outcomesResponse.ok) throw new Error('Failed to fetch outcomes.');

                    const data = await outcomesResponse.json();
                    setOutcomes(data.outcomes);

                    const initialSelections: { [key: string]: string } = {};
                    for (const category in data.outcomes) {
                        initialSelections[category] = data.outcomes[category][0].genotype;
                    }
                    setSelectedGenotypes(initialSelections);

                    // Fetch the initial preview for the most likely outcomes
                    const initialUrl = await updatePreviewImage(initialSelections);
                    if (initialUrl) {
                        setDefaultPreviewUrl(initialUrl);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInitialData();
        }
    }, [isOpen, pair, outcomes, isCrossBreed, updatePreviewImage]);

    useEffect(() => {
        // Don't run if genotypes aren't set yet
        if (Object.keys(selectedGenotypes).length === 0) {
            return;
        }

        // This is the logic that runs every time a select box is changed.
        const handler = setTimeout(() => {
            updatePreviewImage(selectedGenotypes);
        }, 500);

        return () => clearTimeout(handler);
    }, [selectedGenotypes, mostLikelyGenotypes, defaultPreviewUrl, updatePreviewImage]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple max-w-5xl w-full max-h-[85vh] flex flex-col text-pompaca-purple dark:text-purple-300 overflow-y-auto [&>button]:hidden"
            >
                <DialogHeader>
                    <DialogTitle>Possible Outcomes for {pair.pairName}</DialogTitle>
                </DialogHeader>
                {isCrossBreed ? (
                    <div className="p-4 text-center bg-ebena-lavender/50 dark:bg-midnight-purple/50 rounded-md">
                        <h3 className="font-bold text-lg">Cross-Species Breeding</h3>
                        <p className="mt-2 text-dusk-purple dark:text-purple-400">
                            This pair can produce the following species:
                        </p>
                        <ul className="font-semibold my-2">
                            {possibleOffspringSpecies.map((species) => (
                                <li key={species}>{species}</li>
                            ))}
                        </ul>
                        <p className="text-xs italic text-dusk-purple dark:text-purple-400">
                            Detailed gene predictions for cross-species and hybrid pairings are not
                            yet supported.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="space-y-4 rounded-md border bg-ebena-lavender/50 dark:bg-midnight-purple/50 p-4">
                            {isLoading && !outcomes ? <Loader2 className="animate-spin" /> : null}
                            {outcomes &&
                                Object.entries(outcomes).map(([category, categoryOutcomes]) => (
                                    <div key={category} className="space-y-1">
                                        <Label className="font-bold text-pompaca-purple dark:text-purple-300 text-xs">
                                            {category}
                                        </Label>
                                        <Select
                                            value={selectedGenotypes[category]}
                                            onValueChange={(value) =>
                                                setSelectedGenotypes((prev) => ({
                                                    ...prev,
                                                    [category]: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="w-full bg-ebena-lavender dark:bg-midnight-purple px-1 text-xs">
                                                <SelectValue
                                                    placeholder={`Select ${category}...`}
                                                />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="item-aligned"
                                                className="w-max bg-ebena-lavender dark:bg-midnight-purple text-xs"
                                            >
                                                {categoryOutcomes.map((o) => (
                                                    <SelectItem
                                                        key={o.genotype}
                                                        value={o.genotype}
                                                        className="text-xs"
                                                    >
                                                        {o.phenotype} ({o.genotype}) -{' '}
                                                        <span className="font-semibold">
                                                            {(o.probability * 100).toFixed(2)}%
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="border rounded-md flex items-center justify-center bg-ebena-lavender/50 dark:bg-midnight-purple/50 relative min-h-[10rem]">
                                {isLoading && <Loader2 className="animate-spin absolute" />}
                                {previewUrl && (
                                    <img
                                        key={previewUrl} // Force re-render on URL change
                                        src={previewUrl}
                                        alt="Progeny Preview"
                                        className="max-w-full max-h-full object-contain"
                                        onError={() => setPreviewUrl(null)} // Handle broken image links
                                    />
                                )}
                                {!previewUrl && !isLoading && <p>No preview available.</p>}
                            </div>
                            <div className="flex justify-center">
                                <Button
                                    onClick={() => setShowSaveDialog(true)}
                                    disabled={!outcomes || isLoading || isCrossBreed}
                                    className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                                >
                                    Save as Goal
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="text-dusk-purple dark:text-purple-400"
                    >
                        Close
                    </Button>
                </DialogFooter>
                <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <AlertDialogContent className="bg-barely-lilac dark:bg-pompaca-purple">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-pompaca-purple dark:text-purple-300">
                                Save as New Research Goal
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-dusk-purple dark:text-purple-400 text-sm">
                                Configure and name your new goal. It will be created with the
                                currently selected genes and automatically assigned to this pair.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-2 max-h-[50vh] overflow-y-auto pr-2">
                            <div>
                                <Label
                                    htmlFor="goal-name"
                                    className="text-pompaca-purple dark:text-purple-300"
                                >
                                    Goal Name
                                </Label>
                                <Input
                                    id="goal-name"
                                    value={newGoalName}
                                    onChange={(e) => setNewGoalName(e.target.value)}
                                    placeholder="e.g., Perfect Cielarka"
                                    className="bg-ebena-lavender dark:bg-midnight-purple mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-pompaca-purple dark:text-purple-300">
                                    Goal Mode
                                </Label>
                                <RadioGroup
                                    value={goalMode}
                                    onValueChange={(v) =>
                                        setGoalMode(v as 'phenotype' | 'genotype')
                                    }
                                    className="flex space-x-4 mt-1"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="phenotype" id="phenotype" />
                                        <Label htmlFor="phenotype" className="font-normal">
                                            Phenotype
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="genotype" id="genotype" />
                                        <Label htmlFor="genotype" className="font-normal">
                                            Genotype
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div>
                                <Label className="text-pompaca-purple dark:text-purple-300">
                                    Target Genes
                                </Label>
                                <p className="text-xs text-dusk-purple dark:text-purple-400">
                                    Select genes to mark as optional for this goal.
                                </p>
                                <div className="space-y-2 mt-2 rounded-md border p-2 bg-ebena-lavender/50 dark:bg-midnight-purple/50">
                                    {outcomes &&
                                        Object.entries(selectedGenotypes).map(
                                            ([category, genotype]) => {
                                                const outcome = outcomes[category].find(
                                                    (o) => o.genotype === genotype
                                                );
                                                return (
                                                    <div
                                                        key={category}
                                                        className="flex items-center space-x-3"
                                                    >
                                                        <Checkbox
                                                            id={`optional-${category}`}
                                                            checked={!!optionalGenes[category]}
                                                            onCheckedChange={(checked) =>
                                                                setOptionalGenes((prev) => ({
                                                                    ...prev,
                                                                    [category]: !!checked,
                                                                }))
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={`optional-${category}`}
                                                            className="font-normal text-sm flex-grow cursor-pointer"
                                                        >
                                                            {category}: {outcome?.phenotype} (
                                                            {outcome?.genotype})
                                                        </Label>
                                                    </div>
                                                );
                                            }
                                        )}
                                </div>
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleSaveAsGoal}
                                disabled={isSavingGoal || !newGoalName.trim()}
                                className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                            >
                                {isSavingGoal ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Save Goal'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    );
}
