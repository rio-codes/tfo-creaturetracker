"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { structuredGeneData } from "@/lib/creature-data";
import { Loader2, Trash2 } from "lucide-react";
import type { ResearchGoal } from "@/types";

type EditGoalFormProps = {
    goal: ResearchGoal;
    onSuccess: () => void;
};

export function EditGoalForm({ goal, onSuccess }: EditGoalFormProps) {
    const router = useRouter();

    // Initialize state with the existing goal's data
    const [name, setName] = useState(goal.name);
    const [species, setSpecies] = useState(goal.species);
    const [selectedGenes, setSelectedGenes] = useState(
        goal.genes as { [key: string]: string }
    );

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");


    const handleGeneChange = (category: string, genotype: string) => {
        setSelectedGenes((prev) => ({ ...prev, [category]: genotype }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/research-goals/${goal.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, species, genes: selectedGenes }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || "Failed to update goal.");
            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreview = async () => {
        setIsPreviewLoading(true);
        setPreviewError("");
        setPreviewImageUrl(null);
        try {
            const response = await fetch("/api/research-goals/preview-image", {
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
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleDelete = async () => {
        if (
            !window.confirm(
                `Are you sure you want to delete the goal "${goal.name}"?`
            )
        )
            return;
        setIsDeleting(true);
        setError("");
        try {
            const response = await fetch(`/api/research-goals/${goal.id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete goal.");
            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const uniqueGeneOptions = useMemo(() => {
        if (!species || !structuredGeneData[species]) return {};

        const optionsByCat: {
            [key: string]: { value: string; display: string }[];
        } = {};

        for (const [category, genes] of Object.entries(
            structuredGeneData[species]
        )) {
            const phenotypeMap = new Map<string, string[]>();
            (genes as { genotype: string; phenotype: string }[]).forEach(
                (gene) => {
                    if (category != "Gender") {
                        const existing = phenotypeMap.get(gene.phenotype) || [];
                        phenotypeMap.set(gene.phenotype, [
                            ...existing,
                            gene.genotype,
                        ]);
                    } else {
                        phenotypeMap.set(gene.genotype, [gene.genotype]);
                    }
                }
            );
            optionsByCat[category] = Array.from(phenotypeMap.entries()).map(
                ([phenotype, genotypes]) => {
                    let displayText: string;
                    if (genotypes.length === 1 && category != "Gender") {
                        displayText =
                            phenotype === "None"
                                ? "None"
                                : `${phenotype} (${genotypes[0]})`;
                    } else {
                        displayText = phenotype;
                    }
                    return {
                        value: genotypes[0],
                        display: displayText,
                    };
                }
            );
        }
        return optionsByCat;
    }, [species]);

    const geneCategories = uniqueGeneOptions
        ? Object.keys(uniqueGeneOptions)
        : [];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                    placeholder="Goal Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="species-select">Species</Label>
                <Select
                    value={species}
                    onValueChange={(value) => setSpecies(value)}
                    required
                >
                    <SelectTrigger
                        id="species-select"
                        className="w-full bg-ebena-lavender text-pompaca-purple border-pompaca-purple"
                    >
                        <SelectValue placeholder="Species Name" />
                    </SelectTrigger>
                    <SelectContent className="bg-barely-lilac">
                        {Object.keys(structuredGeneData).map((s) => (
                            <SelectItem
                                key={s}
                                value={s}
                                className="hover:bg-pompaca-purple/20"
                            >
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {species && (
                <div className="space-y-4 border p-4 rounded-md bg-ebena-lavender">
                    <h3 className="font-bold text-pompaca-purple">
                        Target Genes
                    </h3>
                    {geneCategories.map((category) => {
                        const selectedValue = selectedGenes[category];
                        const options = uniqueGeneOptions[category] || [];
                        return (
                            <div key={category}>
                                <Label className="font-medium text-pompaca-purple">
                                    {category}
                                </Label>
                                <Select
                                    value={selectedValue}
                                    onValueChange={(value) =>
                                        handleGeneChange(category, value)
                                    }
                                >
                                    <SelectTrigger className="w-full bg-barely-lilac border-pompaca-purple text-pompaca-purple">
                                        <SelectValue
                                            placeholder={`Select ${category}...`}
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="bg-barely-lilac">
                                        {options.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                                className="hover:bg-pompaca-purple/20"
                                            >
                                                {option.display}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Preview Section and Submit Buttons */}
            <div className="space-y-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={isPreviewLoading}
                >
                    {isPreviewLoading ? (
                        <Loader2 className="animate-spin mr-2" />
                    ) : null}
                    Preview Image
                </Button>
                {previewImageUrl && (
                    <img
                        src={previewImageUrl}
                        alt="Preview"
                        className="w-40 h-40 object-contain mx-auto border rounded-md"
                    />
                )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-between items-center pt-4">
                <Button
                    type="button"
                    className="text-red-600"
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
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={onSuccess}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </form>
    );
}
