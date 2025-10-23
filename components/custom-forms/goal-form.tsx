'use client';

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { structuredGeneData, speciesList } from '@/constants/creature-data';
import { Loader2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { EnrichedResearchGoal, GoalGene } from '@/types';

type GeneOption = {
    value: string;
    display: string;
    selection: Omit<GoalGene, 'isOptional'>;
};

type GoalFormProps = {
    goal?: EnrichedResearchGoal;
    onSuccess: () => void; // To close the parent dialog
    isAdminView?: boolean;
};

export function GoalForm({ goal, onSuccess, isAdminView = false }: GoalFormProps) {
    const router = useRouter();
    const isEditMode = !!goal;

    const [name, setName] = useState(goal?.name || '');
    const [species, setSpecies] = useState(goal?.species || '');
    const [goalMode, setGoalMode] = useState(goal?.goalMode || 'phenotype');
    const [selectedGenes, setSelectedGenes] = useState<{
        [key: string]: GoalGene;
    }>(goal?.genes || {});

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(goal?.imageUrl || null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [_previewError, setPreviewError] = useState('');

    const geneOptions = useMemo(() => {
        if (!species || !structuredGeneData[species]) return {};
        const optionsByCat: { [key: string]: GeneOption[] } = {};

        for (const [category, genes] of Object.entries(structuredGeneData[species])) {
            if (typeof genes !== 'object' || !Array.isArray(genes)) {
                continue;
            }

            if (goalMode === 'genotype') {
                const phenotypeMap = new Map<string, string[]>();
                genes.forEach((gene) => {
                    const existing = phenotypeMap.get(gene.phenotype) || [];
                    phenotypeMap.set(gene.phenotype, [...existing, gene.genotype]);
                });

                optionsByCat[category] = genes.map((gene) => {
                    const genotypesForPhenotype = phenotypeMap.get(gene.phenotype) || [];
                    return {
                        value: gene.genotype,
                        display:
                            category === 'Gender'
                                ? gene.genotype
                                : `${gene.genotype} (${gene.phenotype})`,
                        selection: {
                            phenotype: gene.phenotype,
                            genotype: gene.genotype,
                            isMultiGenotype: genotypesForPhenotype.length > 1,
                        },
                    };
                });
            } else {
                const phenotypeMap = new Map<string, string[]>();
                genes.forEach((gene) => {
                    const existing = phenotypeMap.get(gene.phenotype) || [];
                    phenotypeMap.set(gene.phenotype, [...existing, gene.genotype]);
                });

                optionsByCat[category] = Array.from(phenotypeMap.entries()).map(
                    ([phenotype, genotypes]) => {
                        const isMulti = genotypes.length > 1;
                        return {
                            value: phenotype,
                            display:
                                isMulti || category == 'Gender'
                                    ? phenotype
                                    : `${phenotype} (${genotypes[0]})`,
                            selection: {
                                phenotype: phenotype,
                                genotype: genotypes[0],
                                isMultiGenotype: isMulti,
                            },
                        };
                    }
                );
            }
        }
        return optionsByCat;
    }, [species, goalMode]);

    const geneCategories = useMemo(
        () => (geneOptions ? Object.keys(geneOptions) : []),
        [geneOptions]
    );

    useEffect(() => {
        if (isEditMode && goal?.genes) {
            const normalizedGenes: { [key: string]: GoalGene } = {};
            for (const [category, geneData] of Object.entries(goal.genes)) {
                normalizedGenes[category] = {
                    ...(geneData as GoalGene),
                    isOptional: geneData.isOptional ?? false,
                };
            }
            setSelectedGenes(normalizedGenes);
        } else if (!isEditMode && species && geneCategories.length > 0) {
            const defaultSelections: { [key: string]: GoalGene } = {};
            for (const category of geneCategories) {
                const options = geneOptions[category];
                if (options && options.length > 0) {
                    let defaultOption = options[0];
                    if (category === 'Gender') {
                        defaultOption =
                            options.find((opt) => opt.selection.genotype === 'Female') ||
                            options[0];
                    }
                    defaultSelections[category] = {
                        ...defaultOption.selection,
                        isOptional: false,
                    };
                }
            }
            console.log(defaultSelections);
            setSelectedGenes(defaultSelections);
        }
    }, [species, geneCategories, isEditMode, geneOptions, goal?.genes]);

    const handleGeneChange = (category: string, selectedValue: string) => {
        const options = geneOptions[category];
        const selectedOption = options?.find((opt) => opt.value === selectedValue);
        if (selectedOption) {
            setSelectedGenes((prev) => ({
                ...prev,
                [category]: {
                    ...selectedOption.selection,
                    isOptional: prev[category]?.isOptional ?? false,
                },
            }));
        }
        setPreviewImageUrl(null);
    };

    const handleOptionalToggle = (category: string) => {
        setSelectedGenes((prev) => {
            if (!prev[category]) return prev;
            return {
                ...prev,
                [category]: {
                    ...prev[category],
                    isOptional: !prev[category].isOptional,
                },
            };
        });
        setPreviewImageUrl(null);
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const apiUrl = isEditMode ? `/api/research-goals/${goal.id}` : '/api/research-goals';
        const apiMethod = isEditMode ? 'PATCH' : 'POST';
        try {
            const payload = { name, species, genes: selectedGenes, goalMode };
            const response = await fetch(apiUrl, {
                method: apiMethod,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(
                    data.error || `Failed to ${isEditMode ? 'update' : 'create'} goal.`
                );

            onSuccess(); // Close dialog
            router.refresh(); // Re-fetch data for current route

            if (!isEditMode && data.goalId) {
                router.push(`/research-goals/${data.goalId}`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete the goal "${goal?.name}"?`)) return;
        setIsDeleting(true);
        setError('');
        try {
            const apiUrl = isAdminView
                ? `/api/admin/research-goals/${goal?.id}`
                : `/api/research-goals/${goal?.id}`;
            const response = await fetch(apiUrl, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete goal.');
            window.location.reload();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePreview = async () => {
        setIsPreviewLoading(true);
        setPreviewError('');
        setPreviewImageUrl(null);
        try {
            const response = await fetch('/api/research-goals/preview-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ species, genes: selectedGenes }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create image.');
            }
            setPreviewImageUrl(data.imageUrl);
        } catch (err: any) {
            setPreviewError(err.message);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleRandomizeOptional = () => {
        const newSelectedGenes = { ...selectedGenes };
        let changed = false;
        for (const category in newSelectedGenes) {
            // Only randomize genes that are marked as optional
            if (newSelectedGenes[category].isOptional) {
                const options = geneOptions[category];
                if (options && options.length > 0) {
                    const randomIndex = Math.floor(Math.random() * options.length);
                    const randomOption = options[randomIndex];
                    newSelectedGenes[category] = {
                        ...randomOption.selection,
                        isOptional: true, // Ensure it remains optional
                    };
                    changed = true;
                }
            }
        }
        if (changed) {
            setSelectedGenes(newSelectedGenes);
            setPreviewImageUrl(null); // Invalidate preview since genes changed
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            {/* Goal Mode Selector */}
            <div className="space-y-2">
                <Label>Goal Mode</Label>
                <RadioGroup
                    value={goalMode}
                    onValueChange={(value) => setGoalMode(value as 'genotype' | 'phenotype')}
                    className="flex space-x-4"
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
                <p className="text-xs text-dusk-purple pt-1">
                    {goalMode === 'phenotype'
                        ? 'Phenotype mode finds any genotype that produces the desired look.'
                        : 'Genotype mode requires an exact genetic match.'}
                </p>
            </div>
            <div className="space-y-2 mb-3">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                    placeholder="Goal Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss"
                    required
                />
            </div>
            {/* species and gene selectors */}
            <div className="space-y-2 mb-3">
                <Label htmlFor="species-select">Species</Label>
                <Select value={species} onValueChange={(value) => setSpecies(value)} required>
                    <SelectTrigger
                        id="species-select"
                        className="w-full bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-pompaca-purple dark:border-barely-lilac"
                    >
                        <SelectValue placeholder="Species Name" />
                    </SelectTrigger>
                    <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss">
                        {speciesList.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {species && (
                <div className="flex min-h-0 flex-col space-y-4 rounded-md border bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss p-4">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1">
                        <Label className="font-bold text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson col-span-2">
                            Target Genes
                        </Label>
                        <Label className="font-bold text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson text-xs justify-self-center">
                            Optional
                        </Label>
                    </div>
                    <ScrollArea className="max-h-60 pr-4 relative">
                        <div className="space-y-4">
                            {geneCategories.map((category) => {
                                const selectedValue =
                                    goalMode === 'phenotype'
                                        ? selectedGenes[category]?.phenotype || ''
                                        : selectedGenes[category]?.genotype || '';

                                const options = geneOptions[category] || [];
                                return (
                                    <div
                                        key={category}
                                        className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4"
                                    >
                                        <Label className="font-medium dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                            {category}
                                        </Label>
                                        <Select
                                            value={selectedValue}
                                            onValueChange={(value) =>
                                                handleGeneChange(category, value)
                                            }
                                        >
                                            <SelectTrigger className="w-full bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                                <SelectValue
                                                    placeholder={`Select ${category}...`}
                                                />
                                            </SelectTrigger>
                                            <SelectContent className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                                {options.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.display}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Checkbox
                                            checked={selectedGenes[category]?.isOptional || false}
                                            onCheckedChange={() => handleOptionalToggle(category)}
                                            className="mr-2"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <ScrollBar orientation="vertical" />
                        {/* Fake Scrollbar Hint for UI consistency */}
                        <div className="absolute top-0 right-0 h-full w-3 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple">
                            <ChevronUp className="h-4 w-3 text-barely-lilac" />
                            <ChevronDown className="h-4 w-3 text-barely-lilac" />
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* preview section */}
            <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                        onClick={handlePreview}
                        disabled={isPreviewLoading || !species}
                    >
                        {isPreviewLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                        Preview Image
                    </Button>
                    <Button
                        type="button"
                        className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                        onClick={handleRandomizeOptional}
                        disabled={!species}
                    >
                        Randomize Optional
                    </Button>
                </div>
                {previewImageUrl && (
                    <img
                        src={previewImageUrl}
                        alt="Preview"
                        className="w-40 h-40 object-contain mx-auto border rounded-md"
                    />
                )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* submit buttons */}
            <div className="flex justify-between items-center pt-4">
                {isEditMode && (
                    <Button
                        type="button"
                        className="bg-barely-lilac text-red-600 border-2 border-red-600 flex items-center gap-2"
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
                )}
                <div className="flex-grow flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onSuccess}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                    >
                        {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Goal'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
