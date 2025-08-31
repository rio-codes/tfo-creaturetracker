"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, Loader2 } from "lucide-react";
import type {
    EnrichedBreedingPair,
    EnrichedCreature,
    EnrichedResearchGoal,
    Prediction,
} from "@/types";
import { findSuitableMates } from "@/lib/breeding-rules"; // Import the new helper
import * as Sentry from "@sentry/nextjs";

type ManagePairsFormProps = {
    baseCreature: EnrichedCreature;
    allCreatures: EnrichedCreature[];
    allPairs: EnrichedBreedingPair[];
    allGoals: EnrichedResearchGoal[]; // Now needs all goals
    onActionComplete: () => void;
};

export function ManageBreedingPairsForm({
    baseCreature,
    allCreatures,
    allPairs,
    allGoals,
    onActionComplete,
}: ManagePairsFormProps) {
    const router = useRouter();
    const [newPairName, setNewPairName] = useState("");
    const [selectedMateId, setSelectedMateId] = useState<string | undefined>(
        undefined
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // State for predictions
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isPredictionLoading, setIsPredictionLoading] = useState(false);

    const existingPairs = useMemo(
        () =>
            allPairs.filter(
                (p) =>
                    p!.maleParent!.id === baseCreature!.id ||
                    p!.femaleParent!.id === baseCreature!.id
            ),
        [allPairs, baseCreature]
    );

    // Filter suitable mates and goals
    const suitableMates = useMemo(() => {
        return findSuitableMates(baseCreature, allCreatures, allPairs);
    }, [baseCreature, allCreatures, allPairs]);

    const relevantGoals = useMemo(
        () => allGoals.filter((g) => g?.species === baseCreature!.species),
        [allGoals, baseCreature!.species]
    );

    // EFFECT: Fetch predictions whenever a mate is selected
    useEffect(() => {
        if (!selectedMateId) {
            setPredictions([]);
            return;
        }

        const fetchPredictions = async () => {
            setIsPredictionLoading(true);
            const maleParentId =
                baseCreature!.gender === "male"
                    ? baseCreature!.id
                    : selectedMateId;
            const femaleParentId =
                baseCreature!.gender === "female"
                    ? baseCreature!.id
                    : selectedMateId;
            const goalIds = relevantGoals.map((g) => g?.id);

            try {
                const response = await fetch("/api/breeding-predictions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        maleParentId,
                        femaleParentId,
                        goalIds,
                    }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                setPredictions(data.predictions);
            } catch (err) {
                Sentry.captureException(err);
            } finally {
                setIsPredictionLoading(false);
            }
        };

        fetchPredictions();
    }, [selectedMateId, baseCreature, relevantGoals]);

    const handleCreatePair = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMateId) return;
        setIsLoading(true);
        setError("");
        try {
            const maleParentId =
                baseCreature!.gender === "male"
                    ? baseCreature!.id
                    : selectedMateId;
            const femaleParentId =
                baseCreature!.gender === "female"
                    ? baseCreature!.id
                    : selectedMateId;

            const response = await fetch("/api/breeding-pairs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pairName:
                        newPairName ||
                        `${baseCreature!.code} & ${
                            allCreatures.find((c) => c?.id === selectedMateId)
                                ?.code
                        }`,
                    species: baseCreature!.species,
                    maleParentId,
                    femaleParentId,
                }),
            });
            if (!response.ok) throw new Error("Failed to create pair.");
            router.refresh();
            onActionComplete();
            setNewPairName("");
            setSelectedMateId(undefined);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemovePair = async (pairId: string) => {
        if (!window.confirm("Are you sure you want to remove this pair?"))
            return;
        setIsLoading(true);
        try {
            await fetch(`/api/breeding-pairs/${pairId}`, { method: "DELETE" });
            router.refresh();
            onActionComplete();
        } catch (err: any) {
            alert("Failed to remove pair.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Existing Pairs */}
            <div>
                <h4 className="font-bold text-pompaca-purple mb-2">
                    Existing Pairs
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {existingPairs.length > 0 ? (
                        existingPairs.map((pair) => (
                            <div
                                key={pair!.id}
                                className="flex items-center justify-between bg-ebena-lavender p-2 rounded-md"
                            >
                                <span>{pair!.pairName}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemovePair(pair!.id)}
                                    disabled={isLoading}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-dusk-purple">
                            This creature is not in any pairs.
                        </p>
                    )}
                </div>
            </div>

            {/* Create New Pair */}
            <div>
                <h4 className="font-bold text-pompaca-purple mb-2">
                    Create New Pair
                </h4>
                <form onSubmit={handleCreatePair} className="space-y-4">
                    <Input
                        placeholder="New Pair Name (Optional)"
                        value={newPairName}
                        onChange={(e) => setNewPairName(e.target.value)}
                        className="bg-ebena-lavender"
                    />
                    <Select
                        value={selectedMateId}
                        onValueChange={setSelectedMateId}
                        required
                    >
                        <SelectTrigger className="bg-ebena-lavender">
                            <SelectValue placeholder="Select a mate..." />
                        </SelectTrigger>
                        <SelectContent className="bg-ebena-lavender">
                            {suitableMates.length > 0 ? (
                                suitableMates.map((mate) => (
                                    <SelectItem
                                        key={mate.id}
                                        value={mate.id}
                                    >
                                        {mate.creatureName} ({mate.code})
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-sm text-center text-dusk-purple">
                                    No suitable unpaired mates found.
                                </div>
                            )}
                        </SelectContent>
                    </Select>

                    {/* Prediction Display */}
                    {isPredictionLoading && (
                        <div className="text-center">
                            <Loader2 className="animate-spin" />
                        </div>
                    )}
                    {predictions.length > 0 && (
                        <div className="space-y-2 text-sm p-2 border rounded-md bg-ebena-lavender">
                            <h5 className="font-bold">
                                Goal Predictions for this Pairing:
                            </h5>
                            {predictions.map((pred) => (
                                <div
                                    key={pred.goalId}
                                    className="flex justify-between items-center"
                                >
                                    <span>{pred.goalName}</span>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`font-bold text-xs ${
                                                pred.isPossible
                                                    ? "text-green-600"
                                                    : "text-red-500"
                                            }`}
                                        >
                                            {pred.isPossible
                                                ? "POSSIBLE"
                                                : "IMPOSSIBLE"}
                                        </span>
                                        <span className="font-mono font-bold w-20 text-right">
                                            {(pred.averageChance * 100).toFixed(
                                                2
                                            )}
                                            %
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button
                        type="submit"
                        disabled={isLoading || !selectedMateId}
                        className="w-full bg-pompaca-purple text-barely-lilac"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            "Create Pair"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
