'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import type {
    EnrichedCreature,
    Prediction,
    EnrichedResearchGoal,
} from '@/types';
import { LogBreedingDialog } from '@/components/custom-dialogs/log-breeding-dialog';
import { X } from 'lucide-react';

type PredictionsAccordionProps = {
    predictions: Prediction[];
    allCreatures: EnrichedCreature[];
    goal?: EnrichedResearchGoal;
};

const getCacheBustedImageUrl = (
    creature: EnrichedCreature | null | undefined
) => {
    if (!creature?.imageUrl) {
        return '';
    }
    if (creature.updatedAt) {
        return `${creature.imageUrl}?v=${new Date(creature.updatedAt).getTime()}`;
    }
    return creature.imageUrl;
};

export function PredictionsAccordion({
    predictions,
    allCreatures,
}: PredictionsAccordionProps) {
    if (!predictions || predictions.length === 0) {
        return (
            <div className="text-center py-10 px-4 bg-ebena-lavender/50 dark:bg-pompaca-purple/50 rounded-lg">
                <h3 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300">
                    No Assigned Pairs Found
                </h3>
                <p className="text-dusk-purple dark:text-purple-400 mt-2">
                    No assigned breeding pairs of this species were found in
                    your collection.
                </p>
            </div>
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-2">
            {predictions.map((p, index) => {
                const pairForDialog = {
                    id: p.pairId,
                    species: p?.maleParent?.species!,
                };
                return (
                    <AccordionItem
                        key={p.pairId}
                        value={`item-${index}`}
                        className="border border-pompaca-purple/30 rounded-lg bg-ebena-lavender dark:bg-pompaca-purple"
                    >
                        <AccordionTrigger className="p-4 hover:bg-pompaca-purple/10 text-pompaca-purple dark:text-purple-300 text-left">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
                                {/* Left side: Pair Name and Parents */}
                                <div className="flex flex-1 items-center gap-4 min-w-0">
                                    <div className="flex flex-shrink-0 items-center gap-1">
                                        <img
                                            src={getCacheBustedImageUrl(
                                                p.maleParent
                                            )}
                                            alt={
                                                p.maleParent?.code ||
                                                'Male Parent'
                                            }
                                            className="w-10 h-10 object-contain bg-blue-100 p-1 border border-pompaca-purple rounded-md"
                                        />
                                        <X className="h-4 w-4 text-dusk-purple" />
                                        <img
                                            src={getCacheBustedImageUrl(
                                                p.femaleParent
                                            )}
                                            alt={
                                                p.femaleParent?.code ||
                                                'Female Parent'
                                            }
                                            className="w-10 h-10 object-contain bg-pink-100 p-1 border border-pompaca-purple rounded-md"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-wrap">
                                        <div className="font-bold text-xl truncate min-w-0">
                                            {p.pairName}
                                        </div>
                                        <div className="text-xs text-dusk-purple dark:text-purple-400  min-w-0">
                                            {p.maleParent?.creatureName ||
                                                'Unnamed'}{' '}
                                            ({p.maleParent?.code}) x{' '}
                                            {p.femaleParent?.creatureName ||
                                                'Unnamed'}{' '}
                                            ({p.femaleParent?.code})
                                        </div>
                                    </div>
                                </div>

                                {/* Right side: Stats and Button */}
                                <div className="flex flex-col items-stretch gap-y-3 md:flex-row md:items-center md:gap-x-6">
                                    <div className="flex justify-end md:justify-center">
                                        <div className="text-center">
                                            <div className="font-mono text-lg">
                                                {(
                                                    p.averageChance * 100
                                                ).toFixed(2)}
                                                %
                                            </div>
                                            <div className="text-xs text-dusk-purple dark:text-purple-400">
                                                Match Score
                                            </div>
                                        </div>
                                        <div
                                            className={`text-center px-2 text-md ${
                                                p.isPossible
                                                    ? 'text-green-600'
                                                    : 'text-red-500'
                                            }`}
                                        >
                                            {p.isPossible
                                                ? 'POSSIBLE'
                                                : 'IMPOSSIBLE'}
                                        </div>
                                    </div>
                                    <LogBreedingDialog
                                        pair={pairForDialog}
                                        allCreatures={allCreatures}
                                    >
                                        <Button
                                            size="sm"
                                            className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                                        >
                                            Log Breeding
                                        </Button>
                                    </LogBreedingDialog>
                                </div>
                            </div>
                        </AccordionTrigger>

                        {/* Expanded, "deep-dive" view - remains the same */}
                        <AccordionContent className="p-4 bg-barely-lilac dark:bg-midnight-purple border-t border-pompaca-purple/30 dark:border-purple-400/50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4">
                                {Object.entries(p.chancesByCategory || {}).map(
                                    ([category, chance]) => (
                                        <div key={category}>
                                            <div className="font-bold text-pompaca-purple dark:text-purple-300">
                                                {category}
                                            </div>
                                            <div className="font-mono text-lg text-dusk-purple dark:text-purple-400">
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
