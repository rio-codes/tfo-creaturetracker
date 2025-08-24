"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DetailedSerializedGoal, Creature } from "@/types";

type Prediction = {
    pairId: string;
    pairName: string;
    maleParent: Creature;
    femaleParent: Creature;
    averageChance: number;
    isPossible: boolean;
};

type AssignPairDialogProps = {
    goal: DetailedSerializedGoal;
    predictions: Prediction[];
    children: React.ReactNode;
};

export function AssignPairDialog({
    goal,
    predictions,
    children,
}: AssignPairDialogProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Get a list of pair IDs that are already assigned to this goal
    const initiallyAssignedPairIds = new Set(goal.assignedPairIds || []);

    const handleAssignmentChange = async (pairId: string, assign: boolean) => {
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(
                `/api/breeding-pairs/${pairId}/assign-goal`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ goalId: goal.id, assign }),
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Refresh server data to show the updated assignment status
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac">
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple">
                        Assign Pairs to Goal: {goal.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {predictions.map((p) => {
                        const isAssigned = initiallyAssignedPairIds.has(
                            p.pairId
                        );
                        console.log(isAssigned, " is assigned")
                        return (
                            <div
                                key={p.pairId}
                                className="flex items-center justify-between p-3 rounded-md bg-ebena-lavender border border-pompaca-purple/20"
                            >
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id={p.pairId}
                                        checked={isAssigned}
                                        onCheckedChange={(checked) =>
                                            handleAssignmentChange(
                                                p.pairId,
                                                !!checked
                                            )
                                        }
                                        disabled={isLoading}
                                    />
                                    <Label
                                        htmlFor={p.pairId}
                                        className="font-medium text-pompaca-purple"
                                    >
                                        {p.pairName}
                                    </Label>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span
                                        className={`font-bold ${
                                            p.isPossible
                                                ? "text-green-600"
                                                : "text-red-500"
                                        }`}
                                    >
                                        {p.isPossible
                                            ? "POSSIBLE"
                                            : "IMPOSSIBLE"}
                                    </span>
                                    <span className="font-mono font-bold w-20 text-right">
                                        {(p.averageChance * 100).toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
