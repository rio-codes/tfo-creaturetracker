'use client';

import React from 'react';
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
import type { EnrichedBreedingPair, SpeciesBreedingOutcome } from '@/types';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';

type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export function ViewOutcomesDialog({
    children,
    pair,
}: {
    children: React.ReactNode;
    pair: EnrichedBreedingPair;
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [allOutcomes, setAllOutcomes] = useState<SpeciesBreedingOutcome[]>([]);
    const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('female');
    const [_defaultPreviewUrl, setDefaultPreviewUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedGenotypes, setSelectedGenotypes] = useState<{
        [key: string]: string;
    }>({});
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [newGoalName, setNewGoalName] = useState('');
    const [isSavingGoal, setIsSavingGoal] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [goalMode, setGoalMode] = useState<'phenotype' | 'genotype'>('phenotype');
    const [optionalGenes, setOptionalGenes] = useState<Record<string, boolean>>({});

    const currentOutcomes = useMemo(() => {
        return allOutcomes.find((o) => o.species === selectedSpecies)?.geneOutcomes || null;
    }, [allOutcomes, selectedSpecies]);

    const updatePreviewImage = useCallback(
        async (genotypes: { [key: string]: string }, gender: 'male' | 'female') => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/breeding-pairs/${pair.id}/outcomes-preview`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ selectedGenotypes: genotypes, gender: gender }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const newUrl = `${data.imageUrl}?v=${new Date().getTime()}`;
                    setPreviewUrl(newUrl);
                    return newUrl;
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
            return;
        }
        setIsSavingGoal(true);

        try {
            const response = await fetch('/api/research-goals/from-outcomes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goalName: newGoalName,
                    species: selectedSpecies,
                    pairId: pair.id,
                    selectedGenotypes: selectedGenotypes,
                    gender: selectedGender,
                    goalMode: goalMode,
                    isPublic: isPublic,
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
            alert(error.message);
        } finally {
            setIsSavingGoal(false);
        }
    };

    useEffect(() => {
        if (showSaveDialog) {
            setOptionalGenes({});
            setGoalMode('phenotype');
        }
    }, [showSaveDialog]);

    useEffect(() => {
        if (!isOpen) {
            setAllOutcomes([]);
            setSelectedSpecies(null);
            return;
        }

        if (allOutcomes.length === 0) {
            const fetchInitialData = async () => {
                setIsLoading(true);
                try {
                    const outcomesResponse = await fetch(`/api/breeding-pairs/${pair.id}/outcomes`);
                    if (!outcomesResponse.ok) throw new Error('Failed to fetch outcomes.');

                    const { outcomes: fetchedOutcomes }: { outcomes: SpeciesBreedingOutcome[] } =
                        await outcomesResponse.json();
                    setAllOutcomes(fetchedOutcomes);

                    if (fetchedOutcomes.length > 0) {
                        const firstSpecies = fetchedOutcomes[0].species;
                        setSelectedSpecies(firstSpecies);

                        const firstSpeciesOutcomes = fetchedOutcomes[0].geneOutcomes;
                        const initialSelections: { [key: string]: string } = {};
                        for (const category in firstSpeciesOutcomes) {
                            initialSelections[category] =
                                firstSpeciesOutcomes[category][0].genotype;
                        }
                        setSelectedGenotypes(initialSelections);
                        setSelectedGender('female'); // Default to female
                        const initialUrl = await updatePreviewImage(initialSelections, 'female');
                        if (initialUrl) {
                            setDefaultPreviewUrl(initialUrl);
                        }
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInitialData();
        }
    }, [isOpen, pair.id, allOutcomes.length, updatePreviewImage]);

    useEffect(() => {
        if (Object.keys(selectedGenotypes).length === 0 || !selectedSpecies) {
            return;
        }

        const handler = setTimeout(() => {
            updatePreviewImage(selectedGenotypes, selectedGender);
        }, 500);

        return () => clearTimeout(handler);
    }, [selectedGenotypes, selectedSpecies, updatePreviewImage]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e: PointerDownOutsideEvent) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet max-w-5xl w-full max-h-[85vh] flex flex-col text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson overflow-y-auto [&>button]:hidden"
            >
                <DialogHeader>
                    <DialogTitle>Possible Outcomes for {pair.pairName}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    {allOutcomes.length > 1 && (
                        <div className="space-y-2">
                            <Label className="font-bold">Offspring Species</Label>
                            <Select
                                value={selectedSpecies || ''}
                                onValueChange={setSelectedSpecies}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a species to view outcomes..." />
                                </SelectTrigger>
                                <SelectContent className="w-max bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-xs">
                                    {allOutcomes.map((outcome) => (
                                        <SelectItem key={outcome.species} value={outcome.species}>
                                            {outcome.species} (
                                            {(outcome.probability * 100).toFixed(1)}%)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {selectedSpecies && (
                        <div className="space-y-4 rounded-md border bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-midnight-purple p-4">
                            {isLoading && !currentOutcomes ? (
                                <Loader2 className="animate-spin" />
                            ) : null}
                            <div className="space-y-1">
                                <Label className="font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson text-xs">
                                    Gender
                                </Label>
                                <Select
                                    value={selectedGender}
                                    onValueChange={(value) =>
                                        setSelectedGender(value as 'male' | 'female')
                                    }
                                >
                                    <SelectTrigger className="w-full bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss px-1 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent
                                        position="item-aligned"
                                        className="w-max bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-xs"
                                    >
                                        <SelectItem value="female" className="text-xs">
                                            Female
                                        </SelectItem>
                                        <SelectItem value="male" className="text-xs">
                                            Male
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {currentOutcomes &&
                                Object.entries(currentOutcomes).map(
                                    ([category, categoryOutcomes]) => (
                                        <div key={category} className="space-y-1">
                                            <Label className="font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson text-xs">
                                                {category}
                                            </Label>
                                            <Select
                                                value={selectedGenotypes[category]}
                                                onValueChange={(value: string) =>
                                                    setSelectedGenotypes((prev) => ({
                                                        ...prev,
                                                        [category]: value,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger className="w-full bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss px-1 text-xs">
                                                    <SelectValue
                                                        placeholder={`Select ${category}...`}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent
                                                    position="item-aligned"
                                                    className="w-max bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-xs"
                                                >
                                                    {categoryOutcomes.map((o) => (
                                                        <SelectItem
                                                            key={o.genotype}
                                                            value={o.genotype}
                                                            className="text-xs"
                                                        >
                                                            {category === 'Gender'
                                                                ? o.phenotype
                                                                : `${o.phenotype} (${o.genotype})`}{' '}
                                                            -{' '}
                                                            <span className="font-semibold ">
                                                                {(o.probability * 100).toFixed(2)}%
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )
                                )}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 items-center">
                        <div className="border rounded-md flex items-center justify-center bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-midnight-purple relative min-h-[10rem]">
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
                                disabled={!currentOutcomes || isLoading}
                                className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson"
                            >
                                Save as Goal
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine"
                    >
                        Close
                    </Button>
                </DialogFooter>
                <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <AlertDialogContent className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                Save as New Research Goal
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine text-sm">
                                Configure and name your new goal. It will be created with the
                                currently selected genes and automatically assigned to this pair.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-2 max-h-[50vh] overflow-y-auto pr-2">
                            <div>
                                <Label
                                    htmlFor="goal-name"
                                    className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson"
                                >
                                    Goal Name
                                </Label>
                                <Input
                                    id="goal-name"
                                    value={newGoalName}
                                    onChange={(e) => setNewGoalName(e.target.value)}
                                    placeholder="e.g., Perfect Cielarka"
                                    className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss mt-1"
                                />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox
                                        id="save-goal-is-public"
                                        checked={isPublic}
                                        onCheckedChange={(checked) => setIsPublic(!!checked)}
                                    />
                                    <Label htmlFor="save-goal-is-public" className="font-normal">
                                        Make this goal public
                                    </Label>
                                </div>
                                <Label className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                    Goal Mode
                                </Label>
                                <RadioGroup
                                    value={goalMode}
                                    onValueChange={(v: 'phenotype' | 'genotype') =>
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
                                <Label className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                    Target Genes
                                </Label>
                                <p className="text-xs text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                                    Select genes to mark as optional for this goal.
                                </p>
                                <div className="space-y-2 mt-2 rounded-md border p-2 bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-midnight-purple hallowsnight:bg-abyss/50">
                                    {currentOutcomes &&
                                        Object.entries(selectedGenotypes).map(
                                            ([category, selectedGenotype]) => {
                                                const outcome = currentOutcomes[category]?.find(
                                                    (o) => o.genotype === selectedGenotype
                                                );
                                                return (
                                                    <div
                                                        key={category}
                                                        className="flex items-center space-x-3"
                                                    >
                                                        <Checkbox
                                                            id={`optional-${category}`}
                                                            checked={!!optionalGenes[category]}
                                                            onCheckedChange={(checked: boolean) =>
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
                                                            {category}:{' '}
                                                            {outcome?.phenotype || 'N/A'} (
                                                            {selectedGenotype})
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
