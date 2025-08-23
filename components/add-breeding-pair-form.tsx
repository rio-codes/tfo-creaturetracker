"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { Creature, ResearchGoal } from "@/types";

type AddPairFormProps = {
    allCreatures: Creature[];
    allGoals: ResearchGoal[];
    baseCreature?: Creature | null;
    initialGoal?: ResearchGoal | null;
    onSuccess: () => void;
};

export function AddPairForm({
    allCreatures,
    allGoals,
    baseCreature,
    initialGoal,
    onSuccess
}: AddPairFormProps) {
    const router = useRouter();
    const [pairName, setPairName] = useState("");
    const [selectedMaleId, setSelectedMaleId] = useState<string | undefined>(
        undefined
    );
    const [selectedFemaleId, setSelectedFemaleId] = useState<
        string | undefined
    >(undefined);
    const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [selectedSpecies, setSelectedSpecies] = useState<string>("");

    const handleSpeciesChange = (newSpecies: string) => {
        setSelectedSpecies(newSpecies);
        setSelectedMaleId(undefined);
        setSelectedFemaleId(undefined);
        setSelectedGoalIds([]);
    };

    useEffect(() => {
        if (baseCreature) {
            // If a creature is passed in, automatically set the species
            setSelectedSpecies(baseCreature.species || "");
            if (baseCreature.gender === "male") {
                setSelectedMaleId(baseCreature.id);
            } else if (baseCreature.gender === "female") {
                setSelectedFemaleId(baseCreature.id);
            }
        }
        if (initialGoal) {
            setSelectedGoalIds([initialGoal.id]);
        }
    }, [baseCreature, initialGoal]);

    // Get a unique list of all available species from the creature data
    const availableSpecies = useMemo(
        () => [...new Set(allCreatures.map((c) => c.species).filter(Boolean))],
        [allCreatures]
    );

    // Memoize filtered lists for dropdowns based on the selected species
    const { males, females, goals } = useMemo(() => {
        if (!selectedSpecies) {
            return { males: [], females: [], goals: [] };
        }
        return {
            males: allCreatures.filter(
                (c) =>
                    c.species === selectedSpecies &&
                    c.gender === "male" &&
                    c.growthLevel === 3
            ),
            females: allCreatures.filter(
                (c) =>
                    c.species === selectedSpecies &&
                    c.gender === "female" &&
                    c.growthLevel === 3
            ),
            goals: allGoals.filter((g) => g.species === selectedSpecies),
        };
    }, [selectedSpecies, allCreatures, allGoals]);
    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaleId || !selectedFemaleId) {
            setError("Both a male and a female parent must be selected.");
            return;
        }
        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch("/api/breeding-pairs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pairName,
                    species: selectedSpecies,
                    maleParentId: selectedMaleId,
                    femaleParentId: selectedFemaleId,
                    assignedGoalIds: selectedGoalIds,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                console.log(data.error)
                setError("Failed to create pair. " + data.error);
            }
            else {
                console.log(data.message)
                setMessage(data.message)
            }

            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                placeholder="Pair Name (e.g., Silver Project)"
                value={pairName}
                onChange={(e) => setPairName(e.target.value)}
                className="bg-ebena-lavender"
                required
            />

            {/* Species Selector */}
            <Select
                value={selectedSpecies}
                onValueChange={handleSpeciesChange}
                required
            >
                <SelectTrigger className="bg-ebena-lavender">
                    <SelectValue placeholder="Select Species..." />
                </SelectTrigger>
                <SelectContent className="bg-barely-lilac">
                    {availableSpecies.map((species) => (
                        <SelectItem
                            key={species}
                            value={species}
                            className="bg-barely-lilac"
                        >
                            {species}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Parent Selectors - now disabled until a species is chosen */}
            <Select
                value={selectedMaleId}
                onValueChange={setSelectedMaleId}
                required
                disabled={!selectedSpecies}
            >
                <SelectTrigger className="bg-ebena-lavender">
                    <SelectValue placeholder="Select Male Parent..." />
                </SelectTrigger>
                <SelectContent className="bg-barely-lilac">
                    {males.map((c) => (
                        <SelectItem
                            key={c.id}
                            value={c.id}
                            className="bg-barely-lilac"
                        >
                            {c.creatureName} ({c.code})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={selectedFemaleId}
                onValueChange={setSelectedFemaleId}
                required
                disabled={!selectedSpecies}
            >
                <SelectTrigger className="bg-ebena-lavender">
                    <SelectValue placeholder="Select Female Parent..." />
                </SelectTrigger>
                <SelectContent className="bg-barely-lilac">
                    {females.map((c) => (
                        <SelectItem
                            key={c.id}
                            value={c.id}
                            className="bg-barely-lilac"
                        >
                            {c.creatureName} ({c.code})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Goal Selector (Multi-select) */}
            {goals.length > 0 && (
                <div className="space-y-2">
                    <Label>Assign Research Goals</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2">
                        {goals.map((goal) => (
                            <div
                                key={goal.id}
                                className="flex items-center space-x-2"
                            >
                                <Checkbox
                                    id={goal.id}
                                    checked={selectedGoalIds.includes(goal.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedGoalIds((prev) => [
                                                ...prev,
                                                goal.id,
                                            ]);
                                        } else {
                                            setSelectedGoalIds((prev) =>
                                                prev.filter(
                                                    (id) => id !== goal.id
                                                )
                                            );
                                        }
                                    }}
                                />
                                <Label
                                    htmlFor={goal.id}
                                    className="font-normal"
                                >
                                    {goal.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-green-600">{error}</p>}
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Saving..." : "Create Pair"}
            </Button>
        </form>
    );
}
