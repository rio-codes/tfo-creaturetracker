"use client";

import { useState } from "react";
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
import { structuredGeneData } from "@/app/lib/creature_data"

export default function CreateGoalForm() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [species, setSpecies] = useState("");
    const [selectedGenes, setSelectedGenes] = useState<{
        [key: string]: string;
    }>({});
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleGeneChange = (category: string, genotype: string) => {
        setSelectedGenes((prev) => ({ ...prev, [category]: genotype }));
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

            router.push("/research-goals");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const speciesOptions = Object.keys(structuredGeneData);
    const geneCategories = species ? structuredGeneData[species] : {};

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <Input
                placeholder="Goal Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <Select onValueChange={setSpecies} required>
                <SelectTrigger>
                    <SelectValue placeholder="Select a Species..." />
                </SelectTrigger>
                <SelectContent>
                    {speciesOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                            {s}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {species && (
                <div className="space-y-4 border p-4 rounded-md">
                    <h3 className="font-bold">Target Genes for {species}</h3>
                    {Object.entries(geneCategories).map(([category, genes]) => (
                        <div key={category}>
                            <Label>{category}</Label>
                            <Select
                                onValueChange={(value) =>
                                    handleGeneChange(category, value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={`Select ${category}...`}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {genes.map(
                                        (gene: {
                                            genotype: string;
                                            trait: string;
                                        }) => (
                                            <SelectItem
                                                key={gene.genotype}
                                                value={gene.genotype}
                                            >
                                                {gene.genotype} ({gene.trait})
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="text-red-500">{error}</p>}
            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Create Research Goal"}
            </Button>
        </form>
    );
}
