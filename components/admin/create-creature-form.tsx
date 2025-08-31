"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { structuredGeneData, speciesList } from "@/lib/creature-data";
import { Loader2 } from "lucide-react";
import type { GoalGene } from "@/types";
import * as Sentry from "@sentry/nextjs";

type GeneOption = {
    value: string;
    display: string;
    selection: Omit<GoalGene, "isOptional">;
};

export function CreateCreatureForm() {
    const router = useRouter();
    const [creatureName, setCreatureName] = useState("");
    const [creatureCode, setCreatureCode] = useState("");
    const [species, setSpecies] = useState("");
    const [selectedGenes, setSelectedGenes] = useState<{
        [key: string]: GoalGene;
    }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");

    const geneOptions = useMemo(() => {
        if (!species || !structuredGeneData[species]) return {};
        const optionsByCat: { [key: string]: GeneOption[] } = {};

        for (const [category, genes] of Object.entries(
            structuredGeneData[species]
        )) {
            optionsByCat[category] = (
                genes as { genotype: string; phenotype: string }[]
            ).map((gene) => ({
                value: gene.genotype,
                display:
                    category === "Gender"
                        ? gene.genotype
                        : `${gene.phenotype} (${gene.genotype})`,
                selection: {
                    phenotype: gene.phenotype,
                    genotype: gene.genotype,
                    isMultiGenotype: false, // Not relevant for creature creation
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
                    if (category === "Gender") {
                        defaultOption =
                            options.find(
                                (opt) => opt.selection.genotype === "Female"
                            ) || options[0];
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
        const selectedOption = options?.find(
            (opt) => opt.value === selectedValue
        );
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
        setPreviewError("");
        setPreviewImageUrl(null);
        try {
            const response = await fetch("/api/admin/creature-preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ species, genes: selectedGenes }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to create image.");
            }
            setPreviewImageUrl(data.imageUrl);
        } catch (err: any) {
            setPreviewError(err.message);
            Sentry.captureException(err);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const payload = {
                creatureName,
                creatureCode,
                species,
                genes: selectedGenes,
            };
            const response = await fetch("/api/admin/create-creature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || "Failed to create creature.");

            alert("Creature created successfully!"); // Replace with a toast
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="creature-name">Creature Name</Label>
                    <Input
                        id="creature-name"
                        className="bg-ebena-lavender"
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
                        className="bg-ebena-lavender"
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
                    <SelectTrigger id="species-select" className="bg-barely-lilac">
                        <SelectValue placeholder="Select Species..." />
                    </SelectTrigger>
                    <SelectContent className="bg-barely-lilac">
                        {speciesList.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {species && (
                <ScrollArea className="flex-col pr-4 relative border rounded-md p-4">
                    <div className="space-y-4">
                        {geneCategories.map((category) => (
                            <div
                                key={category}
                                className="grid grid-cols-[100px_1fr] items-center gap-x-4"
                            >
                                <Label className="font-medium">
                                    {category}
                                </Label>
                                <Select
                                    value={
                                        selectedGenes[category]?.genotype || ""
                                    }
                                    onValueChange={(value) =>
                                        handleGeneChange(category, value)
                                    }
                                >
                                    <SelectTrigger className="bg-ebena-lavender">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-ebena-lavender">
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
                        ))}
                    </div>
                </ScrollArea>
            )}

            <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        className="bg-pompaca-purple text-barely-lilac"
                        onClick={handlePreview}
                        disabled={isPreviewLoading || !species}
                    >
                        {isPreviewLoading ? (
                            <Loader2 className="animate-spin mr-2" />
                        ) : null}
                        Preview Image
                    </Button>
                </div>
                {previewError && <p className="text-sm text-red-500">{previewError}</p>}
                {previewImageUrl && (
                    <img
                        src={previewImageUrl}
                        alt="Creature Preview"
                        className="w-40 h-40 object-contain mx-auto border rounded-md"
                    />
                )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end pt-4">
                <Button className="bg-pompaca-purple text-barely-lilac"
                    type="submit"
                    disabled={
                        isLoading || !species || !creatureCode || !creatureName
                    }
                >
                    {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Creature
                </Button>
            </div>
        </form>
    );
}
