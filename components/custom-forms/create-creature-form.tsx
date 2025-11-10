'use client';

import React from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormField } from '@/components/ui/form';
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

const createCreatureFormSchema = z.object({
    creatureName: z.string().min(1, 'Creature name is required.'),
    creatureCode: z.string().min(1, 'Creature code is required.'),
    species: z.string().min(1, 'Species is required.'),
    genes: z.record(
        z.string(),
        z.object({
            phenotype: z.string(),
            genotype: z.string(),
            isMultiGenotype: z.boolean().optional(),
            isOptional: z.boolean().optional(),
        })
    ),
});

type CreateCreatureFormValues = z.infer<typeof createCreatureFormSchema>;

export function CreateCreatureForm() {
    const router = useRouter();

    const form = useForm<CreateCreatureFormValues>({
        resolver: zodResolver(createCreatureFormSchema),
        defaultValues: {
            creatureName: '',
            creatureCode: '',
            species: '',
            genes: {},
        },
    });

    const species = form.watch('species');
    const selectedGenes = form.watch('genes');
    const previewImageUrl = form.watch('previewImageUrl' as any); // Using as any to attach to form state

    const geneOptions = useMemo(() => {
        if (!species || !structuredGeneData[species] || structuredGeneData[species].hasNoGenetics)
            return {};
        const optionsByCat: {
            [key: string]: { value: string; display: string; selection: GoalGene }[];
        } = {};

        for (const [category, genes] of Object.entries(structuredGeneData[species])) {
            // Skip non-array properties like 'isSeasonal' or 'hasNoGenetics'
            if (!Array.isArray(genes)) {
                continue;
            }

            optionsByCat[category] = (genes as { genotype: string; phenotype: string }[]).map(
                (gene) => ({
                    value: gene.genotype,
                    display:
                        category === 'Gender'
                            ? gene.genotype
                            : `${gene.phenotype} (${gene.genotype})`,
                    selection: {
                        phenotype: gene.phenotype,
                        genotype: gene.genotype,
                        isMultiGenotype: false, // Not relevant for creature creation
                        isOptional: false,
                    },
                })
            );
        }
        return optionsByCat;
    }, [species]); // Dependency on species from form state

    const geneCategories = useMemo(
        () => (geneOptions ? Object.keys(geneOptions) : []),
        [geneOptions]
    );

    const handlePreview = async () => {
        form.setValue('isPreviewLoading' as any, true);
        form.setValue('previewError' as any, '');
        form.setValue('previewImageUrl' as any, null);
        try {
            const response = await fetch('/api/admin/creature-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    species: form.getValues('species'),
                    genes: form.getValues('genes'),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create image.');
            }
            form.setValue('previewImageUrl' as any, data.imageUrl);
        } catch (err: any) {
            form.setValue('previewError' as any, err.message);
        } finally {
            form.setValue('isPreviewLoading' as any, false);
        }
    };

    const onSubmit = async (values: CreateCreatureFormValues) => {
        try {
            const response = await fetch('/api/admin/create-creature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create creature.');

            toast.success('Creature created successfully!');
            router.push('/admin/creatures');
        } catch (err: any) {
            toast.error('Error creating creature', { description: err.message });
        }
    };

    const isPreviewLoading = form.watch('isPreviewLoading' as any);
    const previewError = form.watch('previewError' as any);
    const { isSubmitting } = form.formState;

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson"
            >
                {/* Top section for name, code, species */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="creature-name">Creature Name</Label>
                            <FormField
                                control={form.control}
                                name="creatureName"
                                render={({ field }) => (
                                    <Input
                                        id="creature-name"
                                        className="bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-pompaca-purple dark:border-purple-400"
                                        placeholder="e.g., Test Hybrid"
                                        {...field}
                                    />
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="creature-code">Creature Code</Label>
                            <FormField
                                control={form.control}
                                name="creatureCode"
                                render={({ field }) => (
                                    <Input
                                        id="creature-code"
                                        className="bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-pompaca-purple dark:border-purple-400"
                                        placeholder="e.g., ABC-XYZ"
                                        {...field}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="species-select">Species</Label>
                        <FormField
                            control={form.control}
                            name="species"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger
                                        id="species-select"
                                        className="bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-pompaca-purple dark:border-purple-400"
                                    >
                                        <SelectValue placeholder="Select Species..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                        {speciesList.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>

                {species && geneCategories.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Left Column: Gene Selectors */}
                        <ScrollArea className="h-96 flex-col pr-4 relative border rounded-md p-4 bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-pompaca-purple">
                            <div className="space-y-4">
                                {geneCategories.map((category) => (
                                    <Controller
                                        key={category}
                                        control={form.control}
                                        name={`genes.${category}.genotype` as const}
                                        render={({ field }) => (
                                            <div className="grid grid-cols-[100px_1fr] items-center gap-x-4">
                                                <Label className="font-medium text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                                    {category}
                                                </Label>
                                                <Select
                                                    value={field.value || ''}
                                                    onValueChange={(value) => {
                                                        const option = geneOptions[category]?.find(
                                                            (opt) => opt.value === value
                                                        );
                                                        if (option) {
                                                            form.setValue(
                                                                `genes.${category}`,
                                                                option.selection
                                                            );
                                                            form.setValue(
                                                                'previewImageUrl' as any,
                                                                null
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-pompaca-purple dark:border-purple-400">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                                        {(geneOptions[category] || []).map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={option.value}
                                                                    value={option.value}
                                                                >
                                                                    {option.display}
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    />
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Right Column: Preview */}
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
                                <div className="w-40 h-40 flex items-center justify-center bg-ebena-lavender/20 dark:bg-midnight-purple hallowsnight:bg-abyss/50 border rounded-md mx-auto">
                                    <p className="text-xs text-dusk-purple text-center p-2">
                                        Click &#34;Preview Image&#34; to see the creature.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !species}
                        className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Creature
                    </Button>
                </div>
            </form>
        </Form>
    );
}
