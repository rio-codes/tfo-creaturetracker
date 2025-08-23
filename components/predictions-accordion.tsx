"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { Creature } from "@/types";

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

type PredictionsAccordionProps = {
    predictions: Prediction[];
};

export function PredictionsAccordion({
    predictions,
}: PredictionsAccordionProps) {
    if (!predictions || predictions.length === 0) {
        return (
            <div className="text-center py-10 px-4 bg-ebena-lavender/50 rounded-lg">
                <h3 className="text-xl font-semibold text-pompaca-purple">
                    No Relevant Pairs Found
                </h3>
                <p className="text-dusk-purple mt-2">
                    No breeding pairs of this species were found in your
                    collection.
                </p>
            </div>
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-2">
            {predictions.map((p, index) => (
                <AccordionItem
                    key={p.pairId}
                    value={`item-${index}`}
                    className="border border-pompaca-purple/30 rounded-lg bg-ebena-lavender overflow-hidden"
                >
                    {/* This is the collapsed, "at-a-glance" view */}
                    <AccordionTrigger className="p-4 hover:bg-pompaca-purple/10 text-pompaca-purple">
                        <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex-1 text-left font-bold truncate">
                                {p.pairName}{" "}
                                <span className="font-normal text-sm">
                                    - {p.maleParent.creatureName} (
                                    {p.maleParent.code}) x{" "}
                                    {p.femaleParent.creatureName} (
                                    {p.femaleParent.code})
                                </span>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="text-center">
                                    <div className="font-mono text-lg">
                                        {(p.averageChance * 100).toFixed(2)}%
                                    </div>
                                    <div className="text-xs text-dusk-purple">
                                        Avg. Chance
                                    </div>
                                </div>
                                <div
                                    className={`text-center font-bold ${
                                        p.isPossible
                                            ? "text-green-600"
                                            : "text-red-500"
                                    }`}
                                >
                                    {p.isPossible ? "POSSIBLE" : "IMPOSSIBLE"}
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-emoji-eggplant hover:bg-dusk-purple text-barely-lilac"
                                    onClick={(e) => {
                                        e.stopPropagation(); /* Add log breeding logic here */
                                    }}
                                >
                                    Log Breeding
                                </Button>
                            </div>
                        </div>
                    </AccordionTrigger>

                    {/* This is the expanded, "deep-dive" view */}
                    <AccordionContent className="p-6 bg-barely-lilac border-2 border-pompaca-purple/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                            {Object.entries(p.chancesByCategory).map(
                                ([category, chance]) => (
                                    <div key={category}>
                                        <div className="font-bold text-pompaca-purple">
                                            {category}
                                        </div>
                                        <div className="font-mono text-lg text-dusk-purple">
                                            {(chance * 100).toFixed(2)}%
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
