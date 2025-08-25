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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { EnrichedCreature, EnrichedBreedingPair } from "@/types";

type LogBreedingFormProps = {
    pair: { id: string; species: string };
    allCreatures: EnrichedCreature[];
    onSuccess: () => void;
};
export function LogBreedingForm({
    pair,
    allCreatures,
    onSuccess,
}: LogBreedingFormProps) {
    const router = useRouter();
    const [progeny1Id, setProgeny1Id] = useState<string | undefined>(undefined);
    const [progeny2Id, setProgeny2Id] = useState<string | undefined>(undefined);
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Filter for potential offspring: same species, growth level 1 (capsule)
    const potentialProgeny = useMemo(() => {
        return allCreatures.filter((c) => c?.species === pair?.species);
    }, [allCreatures, pair?.species]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch("/api/breeding-log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pairId: pair!.id,
                    progeny1Id: progeny1Id || null,
                    progeny2Id: progeny2Id || null,
                    notes,
                }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || "Failed to log event.");

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
            <div>
                <Label>Progeny 1 (Optional)</Label>
                <Select value={progeny1Id} onValueChange={setProgeny1Id}>
                    <SelectTrigger className="bg-barely-lilac">
                        <SelectValue placeholder="Select first offspring..." />
                    </SelectTrigger>
                    <SelectContent className="bg-barely-lilac">
                        <SelectItem value="none" className="bg-barely-lilac">
                            None
                        </SelectItem>
                        {potentialProgeny
                            .filter((p) => p?.id !== progeny2Id)
                            .map((c) => (
                                <SelectItem
                                    key={c?.id}
                                    value={c!.id}
                                    className="bg-barely-lilac"
                                >
                                    {c?.creatureName} ({c?.code})
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Progeny 2 (Optional)</Label>
                <Select value={progeny2Id} onValueChange={setProgeny2Id}>
                    <SelectTrigger className="bg-barely-lilac">
                        <SelectValue placeholder="Select second offspring..." />
                    </SelectTrigger>
                    <SelectContent className="bg-barely-lilac">
                        <SelectItem value="none" className="bg-barely-lilac">
                            None
                        </SelectItem>
                        {potentialProgeny
                            .filter((p) => p?.id !== progeny1Id)
                            .map((c) => (
                                <SelectItem key={c?.id} value={c!.id}>
                                    {c?.creatureName} ({c?.code})
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this breeding event..."
                />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onSuccess}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        "Save Log Entry"
                    )}
                </Button>
            </div>
        </form>
    );
}
