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
import { Loader2 } from "lucide-react";

type GeneOption = {
    value: string;
    display: string;
};

type CreateGoalFormProps = {
    onClose: () => void;
};

export default function CreateGoalForm({ onClose }: CreateGoalFormProps) {
    const router = useRouter();

    const [name, setName] = useState("");
    const [species, setSpecies] = useState("");
    const [selectedGenes, setSelectedGenes] = useState<{
        [key: string]: string;
    }>({});
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");

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
                    const existing = phenotypeMap.get(gene.phenotype) || [];
                    phenotypeMap.set(gene.phenotype, [
                        ...existing,
                        gene.genotype,
                    ]);
                }
            );

            optionsByCat[category] = Array.from(phenotypeMap.entries()).map(
                ([phenotype, genotypes]) => {
                    let displayText: string;

                    if (genotypes.length === 1) {
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

    const handleGeneChange = (category: string, genotype: string) => {
        setSelectedGenes((prev) => ({ ...prev, [category]: genotype }));
        setPreviewImageUrl(null);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const payload = {
            name,
            species,
            genes: selectedGenes,
        };

        try {
            const response = await fetch("/api/research-goals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || "Failed to create goal.");
            onClose();
            router.push("/research-goals");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const isPreviewable = species && selectedGenes["Gender"];
    const geneCategories = uniqueGeneOptions
        ? Object.keys(uniqueGeneOptions)
        : [];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                    id="goal-name"
                    placeholder="enter a name for your goal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-ebena-lavender border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="species-select">Species</Label>
                <Select onValueChange={setSpecies} value={species} required>
                    <SelectTrigger
                        id="species-select"
                        className="w-full bg-ebena-lavender text-pompaca-purple border-pompaca-purple"
                    >
                        <SelectValue placeholder="Select a Species..." />
                    </SelectTrigger>
                    {/* ADDED: className to style the dropdown content area */}
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
                        const selectedValue = selectedGenes[category] || "";
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
                                    {/* ADDED: className to style the dropdown content area */}
                                    <SelectContent className="bg-barely-lilac">
                                        {options.map((option) => (
                                            // ADDED: className to style the individual dropdown items
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
                    disabled={!isPreviewable || isPreviewLoading}
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

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Create Research Goal"}
                </Button>
            </div>
        </form>
    );
}
