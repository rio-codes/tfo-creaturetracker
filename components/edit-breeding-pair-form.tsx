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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash2 } from "lucide-react";
import type { Creature, ResearchGoal } from "@/types";

type BreedingPairWithDetails = {
    id: string;
    pairName: string;
    species: string;
    maleParentId: string;
    femaleParentId: string;
    assignedGoalIds: string[] | null;
};

type EditBreedingPairFormProps = {
    pair: BreedingPairWithDetails;
    allCreatures: Creature[];
    allGoals: ResearchGoal[];
    onSuccess: () => void;
};

export function EditPairForm({
    pair,
    allCreatures,
    allGoals,
    onSuccess,
}: EditBreedingPairFormProps) {
    const router = useRouter();

    // Initialize state with the existing pair's data
    const [pairName, setPairName] = useState(pair.pairName);
    const [selectedMaleId, setSelectedMaleId] = useState(pair.maleParentId);
    const [selectedFemaleId, setSelectedFemaleId] = useState(
        pair.femaleParentId
    );
    const [selectedGoalIds, setSelectedGoalIds] = useState(
        pair.assignedGoalIds || []
    );

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    const { males, females, goals } = useMemo(() => {
        return {
            males: allCreatures.filter(
                (c) =>
                    c.species === pair.species &&
                    c.gender === "male" &&
                    c.growthLevel === 3
            ),
            females: allCreatures.filter(
                (c) =>
                    c.species === pair.species &&
                    c.gender === "female" &&
                    c.growthLevel === 3
            ),
            goals: allGoals.filter((g) => g.species === pair.species),
        };
    }, [allCreatures, allGoals, pair.species]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/breeding-pairs/${pair.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pairName,
                    maleParentId: selectedMaleId,
                    femaleParentId: selectedFemaleId,
                    assignedGoalIds: selectedGoalIds,
                }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || "Failed to update pair.");
            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (
            !window.confirm(
                `Are you sure you want to delete the pair "${pair.pairName}"?`
            )
        )
            return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/breeding-pairs/${pair.id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete pair.");
            router.refresh();
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                placeholder="Pair Name"
                value={pairName}
                onChange={(e) => setPairName(e.target.value)}
                required
            />

            <Select
                value={selectedMaleId}
                onValueChange={setSelectedMaleId}
                disabled={!!selectedMaleId || !!selectedFemaleId}
                required
            >
                <SelectTrigger className="bg-barely-lilac">
                    <SelectValue placeholder="Select Male Parent..." />
                </SelectTrigger>
                <SelectContent className="bg-barely-lilac">
                    {males.map((c) => (
                        <SelectItem
                            key={c.id}
                            value={c.id}
                            className="bg-barely-lilac"
                        >
                            {c.creatureName || c.code}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={selectedFemaleId}
                onValueChange={setSelectedFemaleId}
                required
            >
                <SelectTrigger className="bg-barely-lilac">
                    <SelectValue placeholder="Select Female Parent..." />
                </SelectTrigger>
                <SelectContent className="bg-barely-lilac">
                    {females.map((c) => (
                        <SelectItem
                            key={c.id}
                            value={c.id}
                            className="bg-barely-lilac"
                        >
                            {c.creatureName || c.code}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

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
                                    id={`edit-${goal.id}`}
                                    checked={selectedGoalIds.includes(goal.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked)
                                            setSelectedGoalIds((prev) => [
                                                ...prev,
                                                goal.id,
                                            ]);
                                        else
                                            setSelectedGoalIds((prev) =>
                                                prev.filter(
                                                    (id) => id !== goal.id
                                                )
                                            );
                                    }}
                                />
                                <Label
                                    htmlFor={`edit-${goal.id}`}
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
