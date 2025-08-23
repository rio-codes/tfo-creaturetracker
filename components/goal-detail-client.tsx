"use client";

import type { ResearchGoal, Creature } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PredictionsAccordion } from "@/components/predictions-accordion"
// Define the shape of the prediction data
type Prediction = {
    pairId: string;
    pairName: string;
    maleParent: Creature;
    femaleParent: Creature;
    chancesByCategory: { [key: string]: number };
    averageChance: number;
    isPossible: boolean;
};

type GoalDetailClientProps = {
    goal: ResearchGoal;
    initialPredictions: Prediction[];
};

export function GoalDetailClient({
    goal,
    initialPredictions,
}: GoalDetailClientProps) {
    const geneEntries = goal.genes ? Object.entries(goal.genes) : [];
    console.log(geneEntries)

    return (
        <div className="space-y-7">
            <h1 className="text-4xl font-bold text-pompaca-purple">
                Goal: {goal.name}
            </h1>

            {/* Top Section: Goal Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 bg-ebena-lavender text-pompaca-purple border-border">
                    <CardContent className="p-6 grid grid-cols-2 gap-6 items-center">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 border-b border-pompaca-purple/50 pb-1">
                                Genotype
                            </h3>
                            <div className="space-y-1 text-sm">
                                {geneEntries.map(([category, gene]) => (
                                    <div key={category}>
                                        <strong>{category}:</strong>{" "}
                                        <span className="font-mono">
                                            {gene.genotype}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2 border-b border-pompaca-purple/50 pb-1">
                                Phenotype
                            </h3>
                            <div className="space-y-1 text-sm">
                                {geneEntries.map(([category, gene]) => (
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
                        src={goal.imageUrl}
                        alt={goal.name}
                        className="max-w-full max-h-48 object-contain"
                    />
                </Card>
            </div>

            {/* Bottom Section: Breeding Pairs & Predictions */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-pompaca-purple">
                        Breeding Pairs
                    </h2>
                    <Button
                        disabled
                        className="bg-ebena-lavender hover:bg-dusk-purple text-dusk-purple"
                    >
                        + Add Breeding Pair
                    </Button>
                </div>
                <PredictionsAccordion predictions={initialPredictions} />
            </div>

            <div className="flex w-full justify-center">
                <span className="text-s text-dusk-purple text-center py-5">
                    Note: Some features are still under development and not yet
                    available.
                </span>
            </div>
        </div>
    );
}
