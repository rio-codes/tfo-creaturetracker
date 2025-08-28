"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { structuredGeneData } from "@/lib/creature-data";
import { Loader2, Trash2 } from "lucide-react";
import type { EnrichedResearchGoal } from "@/types";

type GeneSelection = {
    genotype: string;
    phenotype: string;
    isMultiGenotype: boolean;
};
type GeneOption = {
    value: string;
    display: string;
    phenotype: string;
    isMultiGenotype: boolean;
};

type GoalFormProps = {
    goal?: EnrichedResearchGoal;
    onSuccess: () => void;
};

export function GoalForm({ goal, onSuccess }: GoalFormProps) {
    const router = useRouter();
    const isEditMode = !!goal;

    const [name, setName] = useState(goal?.name || "");
    const [species, setSpecies] = useState(goal?.species || "");
    const [goalMode, setGoalMode] = useState(goal?.goalMode || "phenotype");
    const [selectedGenes, setSelectedGenes] = useState<{
        [key: string]: GeneSelection;
    }>(goal?.genes || {});

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(
        goal?.imageUrl || null
    );
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");

    // generate gene options for selected species depending on goal moad
    const geneOptions = useMemo(() => {
        // reset options if species is blank
        if (!species || !structuredGeneData[species]) return {};
        const optionsByCat: { [key: string]: GeneOption[] } = {};

        for (const [category, genes] of Object.entries(
            structuredGeneData[species]
        )) {
            // group all genotypes by their phenotype to calculate isMultiGenotype
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

            if (goalMode === "genotype") {
                // GENOTYPE MODE: show every single genotype as a distinct option
                optionsByCat[category] = (
                    genes as { genotype: string; phenotype: string }[]
                ).map((gene) => {
                    const genotypesForPhenotype =
                        phenotypeMap.get(gene.phenotype) || [];
                    return {
                        value: gene.genotype,
                        display:
                            gene.phenotype === "None" || category === "Gender"
                                ? gene.genotype
                                : `${gene.genotype} (${gene.phenotype})`,
                        phenotype: gene.phenotype,
                        isMultiGenotype: genotypesForPhenotype.length > 1,
                    };
                });
            } else {
                // PHENOTYPE MODE: de-duplicate by phenotype
                optionsByCat[category] = Array.from(phenotypeMap.entries()).map(
                    ([phenotype, genotypes]) => {
                        const isMulti = genotypes.length > 1;
                        return {
                            value: genotypes[0], // Sample genotype
                            display: isMulti
                                ? phenotype
                                : `${phenotype} (${genotypes[0]})`,
                            phenotype: phenotype,
                            isMultiGenotype: isMulti,
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


    // if creating new research goal set default selections to first option in list or female for gender
    useEffect(() => {
        if (!isEditMode && species && geneCategories.length > 0) {
            const defaultSelections: { [key: string]: GeneSelection } = {};
            for (const category of geneCategories) {
                const options = geneOptions[category];
                if (options && options.length > 0) {
                    let defaultOption = options[0];
                    if (category === "Gender") {
                        defaultOption =
                            options.find((opt) => opt.value === "Female") ||
                            options[0];
                    }
                    defaultSelections[category] = {
                        genotype: defaultOption.value,
                        phenotype: defaultOption.phenotype,
                        isMultiGenotype: defaultOption.isMultiGenotype,
                    };
                }
            }
            setSelectedGenes(defaultSelections);
        }
    }, [species, geneCategories, isEditMode, geneOptions]); // re-run when species changes

    // reset genes when species changes and clear preview image
    const handleSpeciesChange = (newSpecies: string) => {
        setSpecies(newSpecies);
        setSelectedGenes({});
        setPreviewImageUrl(null);
    };

    // set genes to selection
    const handleGeneChange = (category: string, selectedValue: string) => {
        const options = geneOptions[category];
        const selectedOption = options?.find(
            (opt) => opt.value === selectedValue
        );
        if (selectedOption) {
            setSelectedGenes((prev) => ({
                ...prev,
                [category]: {
                    genotype: selectedOption.value,
                    phenotype: selectedOption.phenotype,
                    isMultiGenotype: selectedOption.isMultiGenotype,
                },
            }));
        }
        setPreviewImageUrl(null);
    };

    // send form contents to api route based on create or update mode
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        const apiUrl = isEditMode
            ? `/api/research-goals/${goal.id}`
            : "/api/research-goals";
        const apiMethod = isEditMode ? "PATCH" : "POST";
        try {
            const payload = { name, species, genes: selectedGenes, goalMode };
            const response = await fetch(apiUrl, {
                method: apiMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(
                    data.error ||
                        `Failed to ${isEditMode ? "update" : "create"} goal.`
                );
            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // delete goal via api
    const handleDelete = async () => {
        if (
            !window.confirm(
                `Are you sure you want to delete the goal "${goal?.name}"?`
            )
        )
            return;
        setIsDeleting(true);
        setError("");
        try {
            const response = await fetch(`/api/research-goals/${goal?.id}`, {
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

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 mb-3">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                    placeholder="Goal Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-ebena-lavender"
                    required
                />
            </div>

            {/* species and gene selectors */}
            <div className="space-y-2 mb-3">
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
                <div className="space-y-4 border p-4 rounded-md bg-ebena-lavender mb-5">
                    <h3 className="font-bold text-pompaca-purple">
                        Target Genes
                    </h3>
                    {geneCategories.map((category) => {
                        const selectedValue =
                            selectedGenes[category]?.genotype || "";
                        const options = geneOptions[category] || [];
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

            {/* preview section and submit buttons */}
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

            <div className="flex justify-between items-center pt-4">
                {isEditMode && (
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                    </Button>
                )}
                <div className="flex-grow flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onSuccess}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading
                            ? "Saving..."
                            : isEditMode
                            ? "Save Changes"
                            : "Create Goal"}
                    </Button>
                </div>
            </div>
        </form>
    );
}
