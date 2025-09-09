import type { EnrichedCreature } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Award } from 'lucide-react';

type ScoredProgeny = EnrichedCreature & {
    parentPairName: string;
    analysis: {
        score: number;
        nonMatchingGenes: {
            category: string;
            creatureValue: string;
            goalValue: string;
        }[];
    };
};

type Props = {
    scoredProgeny: ScoredProgeny[];
};

const getCacheBustedImageUrl = (
    creature: EnrichedCreature | null | undefined
) => {
    if (!creature?.imageUrl) return '';
    if (creature.updatedAt) {
        return `${creature.imageUrl}?v=${new Date(creature.updatedAt).getTime()}`;
    }
    return creature.imageUrl;
};

const getMatchScoreStyle = (score: number): React.CSSProperties => {
    const hue = (score / 100) * 120; // 0 is red, 120 is green
    return { color: `hsl(${hue}, 90%, 40%)` };
};

export function SharedProgenyAnalysis({ scoredProgeny }: Props) {
    return (
        <div className="mt-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300">
                    Progeny Analysis
                </h2>
            </div>
            <Card className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 border-border">
                <CardContent className="p-4">
                    {scoredProgeny.length > 0 ? (
                        <ul className="space-y-3">
                            {scoredProgeny.map((progeny) => (
                                <li
                                    key={progeny.id}
                                    className="p-3 rounded-md bg-barely-lilac dark:bg-midnight-purple border border-pompaca-purple dark:border-barely-lilac"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <img
                                                src={getCacheBustedImageUrl(
                                                    progeny
                                                )}
                                                alt={
                                                    progeny.creatureName ||
                                                    progeny.code
                                                }
                                                className="w-12 h-12 object-contain rounded-md mr-4 bg-white/10 p-1"
                                            />
                                            <div>
                                                <p className="font-semibold">
                                                    {progeny.creatureName ||
                                                        'Unnamed'}{' '}
                                                    ({progeny.code})
                                                </p>
                                                <p className="text-xs text-dusk-purple dark:text-purple-400">
                                                    From:{' '}
                                                    {progeny.parentPairName}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {progeny.analysis.score === 100 && (
                                                <Award className="h-5 w-5 text-green-500" />
                                            )}
                                            <span
                                                style={getMatchScoreStyle(
                                                    progeny.analysis.score
                                                )}
                                                className={`text-lg ${progeny.analysis.score === 100 ? 'font-bold' : ''}`}
                                            >
                                                {progeny.analysis.score.toFixed(
                                                    0
                                                )}
                                                %
                                            </span>
                                        </div>
                                    </div>
                                    {progeny.analysis.nonMatchingGenes.length >
                                        0 && (
                                        <div className="mt-2 pl-16 text-xs space-y-1">
                                            <p className="font-semibold text-dusk-purple dark:text-purple-400">
                                                Mismatched Traits:
                                            </p>
                                            <ul className="list-disc list-inside text-dusk-purple dark:text-purple-400">
                                                {progeny.analysis.nonMatchingGenes.map(
                                                    (gene) => (
                                                        <li key={gene.category}>
                                                            <span className="font-medium text-pompaca-purple dark:text-purple-300">
                                                                {gene.category}:
                                                            </span>{' '}
                                                            {gene.creatureValue}{' '}
                                                            (Goal:{' '}
                                                            {gene.goalValue})
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-dusk-purple dark:text-purple-400 italic py-4">
                            No adult progeny have been logged for the assigned
                            pairs.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
