"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { EnrichedCreature, Prediction, EnrichedResearchGoal } from "@/types";
import { LogBreedingDialog } from "@/components/custom-dialogs/log-breeding-dialog"


type PredictionsAccordionProps = {
    predictions: Prediction[];
    allCreatures: EnrichedCreature[];
    goal?: EnrichedResearchGoal;
};


export function PredictionsAccordion({
    predictions,
    allCreatures
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
            className="w-full space-y-2"
        >
        {predictions.map((p, index) => {
            const pairForDialog = {
                id: p.pairId,
                species: p?.maleParent?.species!,
            };
            return (
                <AccordionItem
                    key={p.pairId}
                    value={`item-${index}`}
                    className="border border-pompaca-purple/30 rounded-lg bg-ebena-lavender"
                >
                    <AccordionTrigger className="p-4 hover:bg-pompaca-purple/10 text-pompaca-purple text-left">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
                            {/* Left side: Pair Name and Parents */}
                            <div className="flex-1 space-y-1">
                                <div className="font-bold text-lg truncate">
                                    {p.pairName}
                                </div>
                                <div className="font-normal text-sm text-dusk-purple wrap-anywhere">
                                    {p?.maleParent?.creatureName}
                                    {" ("}
                                    {p?.maleParent?.code}){" x "}
                                    {p?.femaleParent?.creatureName}
                                    {" ("}
                                    {p?.femaleParent?.code})
                                </div>
                            </div>

                            {/* Right side: Stats and Button */}
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
                                <LogBreedingDialog
                                    pair={pairForDialog}
                                    allCreatures={allCreatures}
                                >
                                    <Button
                                        size="sm"
                                        className="bg-pompaca-purple text-barely-lilac"
                                    >
                                        Log Breeding
                                    </Button>
                                </LogBreedingDialog>
                            </div>
                        </div>
                    </AccordionTrigger>

                    {/* Expanded, "deep-dive" view - remains the same */}
                    <AccordionContent className="p-6 bg-barely-lilac border-t border-pompaca-purple/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                            {Object.entries(p.chancesByCategory || {}).map(
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
                );
            })}
        </Accordion>
    );
}