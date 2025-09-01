"use client";

import { useState, useMemo, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Trash2, Network } from "lucide-react";
import type {
    EnrichedBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
    DbBreedingPair,
    DbBreedingLogEntry,
} from "@/types";
import { checkForInbreeding, getPossibleOffspringSpecies } from "@/lib/breeding-rules";


type EditBreedingPairFormProps = {
    pair: EnrichedBreedingPair;
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    onSuccess: () => void;
};

export function EditBreedingPairForm({
    pair,
    allCreatures,
    allGoals,
    allPairs,
    allLogs,
    onSuccess,
}: EditBreedingPairFormProps) {
    const router = useRouter();

    // Initialize state with the existing pair's data
    const [pairName, setPairName] = useState(pair?.pairName);
    const [selectedMaleId, setSelectedMaleId] = useState(pair?.maleParentId);
    const [selectedFemaleId, setSelectedFemaleId] = useState(
        pair?.femaleParentId
    );
    const [selectedGoalIds, setSelectedGoalIds] = useState(
        pair?.assignedGoalIds || []
    );
    const [isInbred, setIsInbred] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [editingWhichParent, setEditingWhichParent] = useState<
        "male" | "female" | "none"
    >("none");

    const { males, females, goals } = useMemo(() => {
        return {
            males: allCreatures.filter(
                (c) =>
                    c?.species === pair?.species &&
                    c?.gender === "male" &&
                    c?.growthLevel === 3
            ),
            females: allCreatures.filter(
                (c) =>
                    c?.species === pair?.species &&
                    c?.gender === "female" &&
                    c?.growthLevel === 3
            ),
        };
    }, [allCreatures, pair?.species]);

    const assignableGoals = useMemo(() => {
        const male = allCreatures.find(c => c?.id === selectedMaleId);
        const female = allCreatures.find(c => c?.id === selectedFemaleId);
        if (!male || !female) return [];
        const possibleOffspring = getPossibleOffspringSpecies(male.species!, female.species!);
        return allGoals.filter(g => g && possibleOffspring.includes(g.species!));
    }, [selectedMaleId, selectedFemaleId, allCreatures, allGoals]);

    useEffect(() => {
        if (selectedMaleId && selectedFemaleId) {
            const inbred = checkForInbreeding(selectedMaleId, selectedFemaleId, allLogs, allPairs);
            setIsInbred(inbred);
        } else {
            setIsInbred(false);
        }
    }, [selectedMaleId, selectedFemaleId, allLogs, allPairs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        const species = pair?.species
        try {
            const response = await fetch(`/api/breeding-pairs/${pair?.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pairName: pairName,
                    species,
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
                `Are you sure you want to delete the pair "${pair?.pairName}"?`
            )
        )
            return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/breeding-pairs/${pair?.id}`, {
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
                className="bg-ebena-lavender dark:bg-midnight-purple"
                required
            />

            {isInbred && (
                <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-200/50 dark:bg-yellow-900/50 dark:text-yellow-300 p-2 text-sm text-dusk-purple">
                    <Network className="h-4 w-4 flex-shrink-0" />
                    <span>
                        This pairing is inbred. Progeny will be related.
                    </span>
                </div>
            )}
            <div className="space-y-2">
                <Label>Change Parent</Label>
                <RadioGroup
                    value={editingWhichParent}
                    onValueChange={(value) =>
                        setEditingWhichParent(value as "male" | "female" | "none")
                    }
                    className="flex space-x-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="edit-none" />
                        <Label htmlFor="edit-none" className="font-normal">
                            None
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="edit-male" />
                        <Label htmlFor="edit-male" className="font-normal">
                            Male
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="edit-female" />
                        <Label htmlFor="edit-female" className="font-normal">
                            Female
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <Select
                value={selectedMaleId}
                onValueChange={setSelectedMaleId}
                disabled={editingWhichParent !== "male"}
                required
            >
                <SelectTrigger className="bg-ebena-lavender dark:bg-midnight-purple">
                    <SelectValue placeholder="Select Male Parent..." />
                </SelectTrigger>
                <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple">
                    {males.map((c) => (
                        <SelectItem
                            key={c?.id}
                            value={c!.id}
                        >
                            {c?.creatureName} ({c?.code})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={selectedFemaleId}
                onValueChange={setSelectedFemaleId}
                disabled={editingWhichParent !== "female"}
                required
            >
                <SelectTrigger className="bg-ebena-lavender dark:bg-midnight-purple">
                    <SelectValue placeholder="Select Female Parent..." />
                </SelectTrigger>
                <SelectContent className="bg-ebena-lavender dark:bg-midnight-purple">
                    {females.map((c) => (
                        <SelectItem
                            key={c?.id}
                            value={c!.id}
                        >
                            {c?.creatureName} ({c?.code})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {assignableGoals.length > 0 && (
                <div className="space-y-2">
                    <Label>Assign Research Goals</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2 bg-ebena-lavender dark:bg-midnight-purple">
                        {assignableGoals.map((goal) => (
                            <div
                                key={goal?.id}
                                className="flex items-center space-x-2"
                            >
                                <Checkbox
                                    id={`edit-${goal?.id}`}
                                    checked={selectedGoalIds.includes(goal!.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked)
                                            setSelectedGoalIds((prev) => [
                                                ...prev,
                                                goal!.id,
                                            ]);
                                        else
                                            setSelectedGoalIds((prev) =>
                                                prev.filter(
                                                    (id) => id !== goal?.id
                                                )
                                            );
                                    }}
                                />
                                <Label
                                    htmlFor={`edit-${goal?.id}`}
                                    className="font-normal"
                                >
                                    {goal?.name}
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
                    className="text-red-600 border-red-600 bg-barely-lilac border-1"
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
                    <Button type="submit" className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950" disabled={isLoading || isDeleting}>
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </form>
    );
}