"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { speciesList, structuredGeneData } from "@/lib/creature-data";
import { Loader2 } from "lucide-react";

export function CreateCreatureForm() {
    const router = useRouter();
    const [species, setSpecies] = useState("");
    const [selectedGenes, setSelectedGenes] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const geneOptions = useMemo(() => {
        if (!species || !structuredGeneData[species]) return {};
        const optionsByCat: { [key: string]: { value: string; display: string }[] } = {};
        for (const [category, genes] of Object.entries(structuredGeneData[species])) {
            optionsByCat[category] = (genes as { genotype: string; phenotype: string }[]).map(
                (gene) => ({
                    value: gene.genotype,
                    display: category === "Gender" ? gene.genotype : `${gene.genotype} (${gene.phenotype})`,
                })
            );
        }
        return optionsByCat;
    }, [species]);

    const geneCategories = useMemo(() => (geneOptions ? Object.keys(geneOptions) : []), [geneOptions]);

    const handleGeneChange = (category: string, selectedValue: string) => {
        setSelectedGenes((prev) => ({ ...prev, [category]: selectedValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch("/api/admin/create-creature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ species, genes: selectedGenes }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to create creature.");
            alert("Creature created successfully!");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            alert(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-pompaca-purple dark:text-purple-300">
            <div className="space-y-2">
                <Label htmlFor="species-select">Species</Label>
                <Select value={species} onValueChange={setSpecies} required >
                    <SelectTrigger
                        id="species-select"
                        className="w-full bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400"
                    >
                        <SelectValue placeholder="Select Species..." />
                    </SelectTrigger>
                    <SelectContent className="bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                        {speciesList.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {species && (
                <div className="space-y-4">
                    {geneCategories.map((category) => (
                        <div key={category} className="space-y-2">
                            <Label>{category}</Label>
                            <Select value={selectedGenes[category] || ""} onValueChange={(value) => handleGeneChange(category, value)} required >
                                <SelectTrigger className="w-full bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300 border-pompaca-purple dark:border-purple-400">
                                    <SelectValue placeholder={`Select ${category}...`} />
                                </SelectTrigger>
                                <SelectContent className="bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300">
                                    {geneOptions[category]?.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>{option.display}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={isLoading || !species} className="w-full bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950">
                {isLoading ? <Loader2 className="animate-spin" /> : "Create Creature"}
            </Button>
        </form>
    );
}