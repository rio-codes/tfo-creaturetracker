"use client";
import { useMemo } from "react";
import { useMounted } from "@/hooks/use-mounted";
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    Prediction,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PredictionsAccordion } from "@/components/misc-custom-components/predictions-accordion";
import { AssignPairDialog } from "@/components/custom-dialogs/assign-breeding-pair-dialog";
import { GoalModeSwitcher } from "@/components/custom-dialogs/goal-mode-switcher-dialog";

type GoalDetailClientProps = {
    goal: EnrichedResearchGoal;
    initialPredictions: Prediction[];
    allCreatures: EnrichedCreature[];
};

type PredictionsAccordionProps = {
    predictions: Prediction[];
    allCreatures: EnrichedCreature[];
    goal?: EnrichedResearchGoal;
}

export function GoalDetailClient({
    goal,
    initialPredictions,
    allCreatures,
}: GoalDetailClientProps) {
    const hasMounted = useMounted();

    const geneEntries = goal?.genes ? Object.entries(goal.genes) : [];
    const gender = goal?.genes["Gender"].phenotype;

    const assignedPredictions = useMemo(() => {
        const assignedIds = new Set(goal?.assignedPairIds || []);
        return initialPredictions.filter((p) => assignedIds.has(p.pairId!));
    }, [initialPredictions, goal?.assignedPairIds]);

    return (
        <div className="space-y-8">
            <div className="flex-col gap-4">
                <h1 className="text-4xl font-bold text-pompaca-purple">
                    Goal: {goal?.name}
                </h1>
                <div className="mt-5">
                    <GoalModeSwitcher goal={goal} />
                </div>
            </div>
            {/* Top Section: Goal Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 bg-ebena-lavender text-pompaca-purple border-border">
                    <CardContent className="p-6 grid grid-cols-2 gap-6 items-center">
                        <div className="text-lg font-semibold">
                            <span>Species:</span>{" "}
                            <span className="text-lg font-normal">
                                {goal?.species}
                            </span>
                        </div>
                        <div className="text-lg font-semibold">
                            Gender:
                            <span className="text-lg font-normal">
                                {" "}
                                {gender}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2 border-b border-pompaca-purple/50 pb-1">
                                Genotype
                            </h3>
                            <div className="space-y-1 text-sm">
                                {geneEntries
                                    .filter(
                                        ([category]) => category !== "Gender"
                                    )
                                    .map(([category, gene]) => (
                                        <div key={category}>
                                            <strong>{category}:</strong>{" "}
                                            {gene.genotype}
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2 border-b border-pompaca-purple/50 pb-1">
                                Phenotype
                            </h3>
                            <div className="space-y-1 text-sm">
                                {geneEntries
                                    .filter(
                                        ([category]) => category !== "Gender"
                                    )
                                    .map(([category, gene]) => (
                                        <div key={category}>
                                            <strong>{category}:</strong>{" "}
                                            {gene.phenotype}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-ebena-lavender text-pompaca-purple border-border flex flex-col items-center justify-center p-4">
                    <img
                        src={goal?.imageUrl ?? ""}
                        alt={goal?.name}
                        className="max-w-full max-h-48 object-contain"
                    />
                </Card>
            </div>
            {/* Bottom Section */}
            <div className="mt-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-pompaca-purple">
                        Breeding Pairs
                    </h2>
                    <AssignPairDialog
                        goal={goal}
                        predictions={initialPredictions}
                    >
                        <Button className="bg-emoji-eggplant hover:bg-dusk-purple text-barely-lilac">
                            Manage Breeding Pairs
                        </Button>
                    </AssignPairDialog>
                </div>
                {hasMounted ? (
                    <PredictionsAccordion
                        predictions={assignedPredictions}
                        allCreatures={allCreatures}
                        goal={goal}
                    />
                ) : (
                    // If it hasn't (i.e., during the server render), we render a simple placeholder.
                    // This placeholder MUST have a similar structure to the real component's container.
                    <div className="w-full space-y-2">
                        <div className="h-16 bg-ebena-lavender rounded-lg animate-pulse"></div>
                        <div className="h-16 bg-ebena-lavender rounded-lg animate-pulse"></div>
                    </div>
                )}
            </div>

            {/* Note Section */}
            <div className="flex w-full justify-center">
                <span className="text-s text-dusk-purple text-center py-5">
                    Note: Some features are still under development and not yet
                    available.
                </span>
            </div>
        </div>
    );
}
