import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import type { Prediction, EnrichedCreature } from '@/types';
import { X } from 'lucide-react';

type Props = {
    predictions: Prediction[];
};

const getCacheBustedImageUrl = (creature: EnrichedCreature | null | undefined) => {
    if (!creature?.imageUrl) return '';
    if (creature.updatedAt) {
        return `${creature.imageUrl}?v=${new Date(creature.updatedAt).getTime()}`;
    }
    return creature.imageUrl;
};

export function SharedPredictionsAccordion({ predictions }: Props) {
    if (!predictions || predictions.length === 0) {
        return (
            <div className="text-center py-10 px-4 bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet/50 rounded-lg">
                <h3 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                    No Assigned Pairs Found
                </h3>
                <p className="text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine mt-2">
                    No breeding pairs have been assigned to this goal.
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
                    className="border border-pompaca-purple/30 rounded-lg bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet w-90% mx-auto"
                >
                    <AccordionTrigger className="p-4 hover:bg-pompaca-purple/10 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson text-left">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex flex-1 items-center gap-4 min-w-0 mr-1 ml-1">
                                <div className="flex flex-shrink-0 items-center gap-1">
                                    <img
                                        src={getCacheBustedImageUrl(p.maleParent)}
                                        alt={p.maleParent?.code || 'Male Parent'}
                                        className="w-10 h-10 object-contain bg-blue-100 p-1 border border-pompaca-purple rounded-md"
                                    />
                                    <X className="h-4 w-4 text-dusk-purple" />
                                    <img
                                        src={getCacheBustedImageUrl(p.femaleParent)}
                                        alt={p.femaleParent?.code || 'Female Parent'}
                                        className="w-10 h-10 object-contain bg-pink-100 p-1 border border-pompaca-purple rounded-md"
                                    />
                                </div>
                                <div className="min-w-0 flex-wrap">
                                    <div className="font-bold text-md truncate min-w-0">
                                        {p.pairName}
                                    </div>
                                    <div className="text-xs text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine  min-w-0">
                                        {p.maleParent?.creatureName || 'Unnamed'} (
                                        {p.maleParent?.code}) (G
                                        {p.maleParent?.generation}) x{' '}
                                        {p.femaleParent?.creatureName || 'Unnamed'} (
                                        {p.femaleParent?.code}) (G
                                        {p.femaleParent?.generation})
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-end-safe ml-2 flex-1 justify-end-safe gap-y-3 mr-5 md:flex-row md:items-center md:gap-x-6">
                                <div className="flex w-full md:justify-center">
                                    <div className="flex text-center">
                                        <div>
                                            <div className="font-mono text-lg">
                                                {(p.averageChance * 100).toFixed(2)}%
                                            </div>
                                            <div className="text-xs text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                                                Match Score
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className={`text-center text-lg font-semibold py-1 mt-6 md:mt-1 px-3 text-md ${p.isPossible ? 'text-green-600' : 'text-red-500'}`}
                                >
                                    {p.isPossible ? 'POSSIBLE' : 'IMPOSSIBLE'}
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss border-t border-pompaca-purple/30 dark:border-purple-400/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4">
                            {Object.entries(p.chancesByCategory || {}).map(([category, chance]) => (
                                <div key={category}>
                                    <div className="font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                        {category}
                                    </div>
                                    <div className="font-mono text-lg text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                                        {(chance * 100).toFixed(2)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
