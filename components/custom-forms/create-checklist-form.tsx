'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import { speciesList, structuredGeneData } from '@/constants/creature-data';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/shadcn-alert';

type GeneInfo = {
    category: string;
    geneCount: number;
};

type CreateChecklistFormProps = {
    onSuccess: () => void;
};

const formSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters long.').max(100),
    species: z.string().nonempty('You must select a species.'),
    targetGenes: z
        .array(
            z.object({
                category: z.string(),
                geneCount: z.number(),
            })
        )
        .nonempty('You must select at least one gene category.'),
});

export function CreateChecklistForm({ onSuccess }: CreateChecklistFormProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('');
    const [selectedGenes, setSelectedGenes] = useState<GeneInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

    const availableGenes = useMemo(() => {
        if (!species) return [];
        const speciesData = structuredGeneData[species];
        if (!speciesData || speciesData.hasNoGenetics) return [];

        return Object.entries(speciesData)
            .filter(([key]) => !['isSeasonal', 'Gender', 'hasNoGenetics'].includes(key))
            .map(([category, genes]) => {
                const firstGene = (genes as any[])[0]?.genotype;
                const geneCount = firstGene ? Math.ceil(firstGene.length / 2) : 0;
                return { category, geneCount };
            })
            .filter((g) => g.geneCount > 0);
    }, [species]);

    useEffect(() => {
        // Reset selected genes when species changes
        setSelectedGenes([]);
    }, [species]);

    const handleGeneSelection = (gene: GeneInfo, checked: boolean) => {
        setSelectedGenes((prev) => {
            if (checked) {
                return [...prev, gene];
            } else {
                return prev.filter((g) => g.category !== gene.category);
            }
        });
    };

    const isGeneDisabled = (gene: GeneInfo): boolean => {
        const isSelected = selectedGenes.some((g) => g.category === gene.category);
        if (isSelected) return false;

        const hasTriHybrid = selectedGenes.some((g) => g.geneCount === 3);
        const nonTriHybridCount = selectedGenes.filter((g) => g.geneCount !== 3).length;

        if (gene.geneCount === 3) {
            return hasTriHybrid || nonTriHybridCount > 0;
        } else {
            return hasTriHybrid || nonTriHybridCount >= 2;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        const validation = formSchema.safeParse({ name, species, targetGenes: selectedGenes });
        if (!validation.success) {
            const flatErrors = validation.error.flatten().fieldErrors;
            setErrors(flatErrors);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/checklists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, species, targetGenes: selectedGenes }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to create checklist.');
            }

            toast.success(`Checklist "${name}" created successfully!`);
            router.refresh();
            onSuccess();
        } catch (error: any) {
            setErrors({ form: [error.message] });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Checklist Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Cielarka Cimo Wings"
                    className="bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name[0]}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="species">Species</Label>
                <Select value={species} onValueChange={setSpecies}>
                    <SelectTrigger className="bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss">
                        <SelectValue placeholder="Select a species" />
                    </SelectTrigger>
                    <SelectContent>
                        {speciesList.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.species && <p className="text-sm text-red-500">{errors.species[0]}</p>}
            </div>

            {species && (
                <div className="space-y-2">
                    <Label>Target Genes</Label>
                    <p className="text-sm text-muted-foreground">
                        Select one tri-hybrid gene OR up to two mono/di-hybrid genes.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4 bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss">
                        {availableGenes.length > 0 ? (
                            availableGenes.map((gene) => (
                                <div key={gene.category} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={gene.category}
                                        checked={selectedGenes.some(
                                            (g) => g.category === gene.category
                                        )}
                                        onCheckedChange={(checked) =>
                                            handleGeneSelection(gene, !!checked)
                                        }
                                        disabled={isGeneDisabled(gene)}
                                    />
                                    <label
                                        htmlFor={gene.category}
                                        className={`text-sm font-medium leading-none ${isGeneDisabled(gene) ? 'text-muted-foreground' : ''}`}
                                    >
                                        {gene.category} (
                                        {gene.geneCount === 1
                                            ? 'Mono'
                                            : gene.geneCount === 2
                                              ? 'Di'
                                              : 'Tri'}
                                        -hybrid)
                                    </label>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground col-span-full">
                                This species has no genetic data available.
                            </p>
                        )}
                    </div>
                    {errors.targetGenes && (
                        <p className="text-sm text-red-500">{errors.targetGenes[0]}</p>
                    )}
                </div>
            )}

            {errors.form && (
                <Alert>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.form[0]}</AlertDescription>
                </Alert>
            )}

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson"
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Checklist
                </Button>
            </div>
        </form>
    );
}
