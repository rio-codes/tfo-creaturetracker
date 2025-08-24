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
                    No Assigned Pairs Found
                </h3>
                <p className="text-dusk-purple mt-2">
                    No assigned breeding pairs of this species were found in your
                    collection.
                </p>
            </div>
        );
    }

    return (
        <Accordion
            type="single"
            collapsible
            className="w-full space-y-2 overflow-y-auto"
        >
            {predictions.map((p, index) => (
                <AccordionItem
                    key={p.pairId}
                    value={`item-${index}`}
                    className="border border-pompaca-purple/30 rounded-lg bg-ebena-lavender"
                >
                    <AccordionTrigger className="p-4 hover:bg-pompaca-purple/10 text-pompaca-purple text-left">
                        {/* Main container for the trigger content */}
                        {/* It's a column on mobile, and a row on medium screens and up */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
                            {/* Left side: Pair Name and Parents */}
                            <div className="flex-1 space-y-1">
                                <div className="font-bold text-lg truncate">
                                    {p.pairName}
                                </div>
                                <div className="font-normal text-sm text-dusk-purple wrap-anywhere">
                                    {p.maleParent.creatureName}
                                    {" ("}
                                    {p.maleParent.code}){" x "}
                                    {p.femaleParent.creatureName}
                                    {" ("}
                                    {p.femaleParent.code})
                                </div>
                            </div>

                            {/* Right side: Stats and Button */}
                            {/* Stacks vertically on mobile with space between, row on desktop */}
                            <div className="flex flex-col items-stretch gap-y-3 md:flex-row md:items-center md:gap-x-6">
                                <div className="flex justify-between md:justify-center">
                                    <div className="text-center">
                                        <div className="font-mono text-lg">
                                            {(p.averageChance * 100).toFixed(2)}
                                            %
                                        </div>
                                        <div className="text-xs text-dusk-purple">
                                            Match Score
                                        </div>
                                    </div>
                                    <div
                                        className={`text-center px-2 text-md ${
                                            p.isPossible
                                                ? "text-green-600"
                                                : "text-red-500"
                                        }`}
                                    >
                                        {p.isPossible
                                            ? "POSSIBLE"
                                            : "IMPOSSIBLE"}
                                    </div>
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

                    {/* Expanded, "deep-dive" view - remains the same */}
                    <AccordionContent className="p-6 bg-barely-lilac border-t border-pompaca-purple/30">
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