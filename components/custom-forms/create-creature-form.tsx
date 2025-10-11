'use client';
import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { structuredGeneData, speciesList } from '@/constants/creature-data';
import { Loader2 } from 'lucide-react';
import type { GoalGene } from '@/types';
type GeneOption = {
    value: string;
    display: string;
    selection: Omit<GoalGene, 'isOptional'> & { gender?: 'Male' | 'Female' };
};
export function CreateCreatureForm() {
    const router = useRouter();
    const [creatureName, setCreatureName] = useState('');
    const [creatureCode, setCreatureCode] = useState('');
    const [species, setSpecies] = useState('');
    const [selectedGenes, setSelectedGenes] = useState<{
        [key: string]: GoalGene;
    }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState('');
    const geneOptions = useMemo(() => {
        if (!species || !structuredGeneData[species]) return {};
        const optionsByCat: { [key: string]: GeneOption[] } = {};
        const isDimorphic = structuredGeneData[species]?.Dimorphic === 'True';
        const selectedGender = selectedGenes['Gender']?.phenotype as 'Male' | 'Female' | undefined;
        for (const [category, genes] of Object.entries(structuredGeneData[species])) {
            if (!Array.isArray(genes)) {
                continue;
            }
            let categoryGenes = genes;
            if (isDimorphic && category !== 'Gender' && selectedGender) {
                categoryGenes = categoryGenes.filter(
                    (g) => !g.gender || g.gender === selectedGender
                );
            }
            optionsByCat[category] = categoryGenes.map((gene) => ({
                value: gene.genotype,
                display:
                    category === 'Gender' ? gene.genotype : `${gene.phenotype} (${gene.genotype})`,
                selection: {
                    phenotype: gene.phenotype,
                    genotype: gene.genotype,
                    gender: gene.gender,
                    isMultiGenotype: false,
                },
            }));
        }
        return optionsByCat;
    }, [species]);
    const geneCategories = useMemo(
        () => (geneOptions ? Object.keys(geneOptions) : []),
        [geneOptions]
    );
    useEffect(() => {
        if (species && geneCategories.length > 0) {
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
            setSelectedGenes(defaultSelections);
        }
    }, [species, geneCategories, geneOptions]);
    const handleGeneChange = (category: string, selectedValue: string) => {
        const options = geneOptions[category];
        const selectedOption = options?.find((opt) => opt.value === selectedValue);
        if (selectedOption) {
            setSelectedGenes((prev) => ({
                ...prev,
                [category]: { ...selectedOption.selection, isOptional: false },
            }));
        }
        setPreviewImageUrl(null);
    };
    const handlePreview = async () => {
        setIsPreviewLoading(true);
        setPreviewError('');
        setPreviewImageUrl(null);
        try {
            const response = await fetch('/api/admin/creature-preview', {
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
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const payload = {
                creatureName,
                creatureCode,
                species,
                genes: selectedGenes,
            };
            const response = await fetch('/api/admin/create-creature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create creature.');
            alert('Creature created successfully!');
            router.push('/admin/creatures');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 text-pompaca-purple dark:text-purple-300"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="creature-name">Creature Name</Label>
                        <Input
                            id="creature-name"
                            className="bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400"
                            placeholder="e.g., Test Hybrid"
                            value={creatureName}
                            onChange={(e) => setCreatureName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="creature-code">Creature Code</Label>
                        <Input
                            id="creature-code"
                            className="bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400"
                            placeholder="e.g., ABC-XYZ"
                            value={creatureCode}
                            onChange={(e) => setCreatureCode(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="species-select">Species</Label>
                    <Select value={species} onValueChange={setSpecies} required>
                        <SelectTrigger
                            id="species-select"
                            className="bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400"
                        >
                            <SelectValue placeholder="Select Species..." />
                        </SelectTrigger>
                        <SelectContent className="bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                            {speciesList.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {species && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <ScrollArea className="h-96 flex-col pr-4 relative border rounded-md p-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50">
                        <div className="space-y-4">
                            {geneCategories.map((category) => (
                                <div
                                    key={category}
                                    className="grid grid-cols-[100px_1fr] items-center gap-x-4"
                                >
                                    <Label className="font-medium text-pompaca-purple dark:text-purple-300">
                                        {category}
                                    </Label>
                                    <Select
                                        value={selectedGenes[category]?.genotype || ''}
                                        onValueChange={(value) => handleGeneChange(category, value)}
                                    >
                                        <SelectTrigger className="bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                            {(geneOptions[category] || []).map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.display}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                onClick={handlePreview}
                                className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                                disabled={isPreviewLoading || !species}
                            >
                                {isPreviewLoading ? (
                                    <Loader2 className="animate-spin mr-2" />
                                ) : null}
                                Preview Image
                            </Button>
                        </div>
                        {previewError && <p className="text-sm text-red-500">{previewError}</p>}
                        {previewImageUrl ? (
                            <img
                                src={previewImageUrl}
                                alt="Creature Preview"
                                className="w-40 h-40 object-contain mx-auto border rounded-md"
                            />
                        ) : (
                            <div className="w-40 h-40 flex items-center justify-center bg-ebena-lavender/20 dark:bg-midnight-purple/50 border rounded-md mx-auto">
                                <p className="text-xs text-dusk-purple text-center p-2">Click &</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    disabled={isLoading || !species || !creatureCode || !creatureName}
                    className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Creature
                </Button>
            </div>
        </form>
    );
}
