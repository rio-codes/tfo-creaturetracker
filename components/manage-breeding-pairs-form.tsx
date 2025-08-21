"use client";

import { useState, useMemo } from "react";
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
import type { Creature } from "@/types";

type BreedingPairWithDetails = {
    id: string;
    pairName: string;
    maleParent: Creature;
    femaleParent: Creature;
};

type ManageBreedingPairsFormProps = {
    baseCreature: Creature;
    allCreatures: Creature[];
    allPairs: BreedingPairWithDetails[];
    onActionComplete: () => void;
};

export function ManageBreedingPairsForm({
    baseCreature,
    allCreatures,
    allPairs,
    onActionComplete,
}: ManageBreedingPairsFormProps) {
    const router = useRouter();
    const [newPairName, setNewPairName] = useState("");
    const [selectedMateId, setSelectedMateId] = useState<string | undefined>(
        undefined
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Find all pairs this creature is already a part of
    const existingPairs = useMemo(
        () =>
            allPairs.filter(
                (p) =>
                    p.maleParent.id === baseCreature.id ||
                    p.femaleParent.id === baseCreature.id
            ),
        [allPairs, baseCreature]
    );

    // Find all creatures that are suitable mates (adult, same species, opposite gender, and NOT already paired)
    const suitableMates = useMemo(() => {
        const pairedCreatureIds = new Set(
            allPairs.flatMap((p) => [p.maleParent.id, p.femaleParent.id])
        );
        return allCreatures.filter(
            (c) =>
                c.id !== baseCreature.id &&
                c.species === baseCreature.species &&
                c.gender !== baseCreature.gender &&
                c.growthLevel === 3 &&
                !pairedCreatureIds.has(c.id)
        );
    }, [allCreatures, allPairs, baseCreature]);

    const handleCreatePair = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMateId) return;
        setIsLoading(true);
        setError("");
        try {
            const maleParentId =
                baseCreature.gender === "male"
                    ? baseCreature.id
                    : selectedMateId;
            const femaleParentId =
                baseCreature.gender === "female"
                    ? baseCreature.id
                    : selectedMateId;

            const response = await fetch("/api/breeding-pairs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pairName:
                        newPairName ||
                        `${baseCreature.code} & ${
                            allCreatures.find((c) => c.id === selectedMateId)
                                ?.code
                        }`,
                    species: baseCreature.species,
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
        } catch (err) {
            alert("Failed to remove pair.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Section 1: Existing Pairs */}
            <div>
                <h4 className="font-bold text-pompaca-purple mb-2">
                    Existing Pairs
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {existingPairs.length > 0 ? (
                        existingPairs.map((pair) => (
                            <div
                                key={pair.id}
                                className="flex items-center justify-between bg-ebena-lavender p-2 rounded-md"
                            >
                                <span>{pair.pairName}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemovePair(pair.id)}
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

            {/* Section 2: Create New Pair */}
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
                        <SelectTrigger className="bg-barely-lilac">
                            <SelectValue placeholder="Select a mate..." />
                        </SelectTrigger>
                        <SelectContent className="bg-barely-lilac">
                            {suitableMates.length > 0 ? (
                                suitableMates.map((mate) => (
                                    <SelectItem
                                        key={mate.id}
                                        value={mate.id}
                                        className="bg-barely-lilac"
                                    >
                                        {mate.creatureName || mate.code}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-sm text-center text-dusk-purple">
                                    No suitable unpaired mates found.
                                </div>
                            )}
                        </SelectContent>
                    </Select>
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
