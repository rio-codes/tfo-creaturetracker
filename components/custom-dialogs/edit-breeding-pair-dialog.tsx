"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GoalPredictionSummary } from "../misc-custom-components/goal-prediction-summary";
import type { EnrichedBreedingPair, EnrichedCreature, EnrichedResearchGoal, DbBreedingPair, DbBreedingLogEntry, Prediction } from "@/types";
import { useEffect, useState } from "react";

type EditBreedingPairDialogProps = {
    children: React.ReactNode;
    pair: EnrichedBreedingPair;
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
};

// This is a placeholder component to demonstrate the requested feature.
// You should integrate this logic into your actual EditBreedingPairDialog.
export function EditBreedingPairDialog({ children, pair, allGoals }: EditBreedingPairDialogProps) {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // When the dialog opens, fetch predictions for this pair against all goals.
            const fetchPredictions = async () => {
                const goalIds = allGoals.map(g => g.id);
                const response = await fetch('/api/breeding-predictions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        maleParentId: pair.maleParentId,
                        femaleParentId: pair.femaleParentId,
                        goalIds,
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    setPredictions(data.predictions);
                }
            };
            fetchPredictions();
        }
    }, [isOpen, pair, allGoals]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac flex max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Pair: {pair.pairName}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] p-4">
                    <h3 className="font-bold text-lg mb-2">Goal Predictions for this Pairing</h3>
                    <div className="space-y-4">
                        {predictions.map(prediction => {
                            const goal = allGoals.find(g => g.id === prediction.goalId);
                            if (!goal) return null;
                            return (
                                <div key={prediction.goalId} className="p-2 border rounded-md">
                                    <p className="font-semibold">{goal.name} - <span className={prediction.isPossible ? 'text-green-600' : 'text-red-600'}>{prediction.isPossible ? `${Math.round(prediction.averageChance * 100)}% Match` : 'Impossible'}</span></p>
                                    <GoalPredictionSummary goal={goal} prediction={prediction} />
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
