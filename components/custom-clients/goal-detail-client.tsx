'use client';
import { useMemo, useState } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { useRouter } from 'next/navigation';
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    Prediction,
    EnrichedBreedingPair,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PredictionsAccordion } from '@/components/misc-custom-components/predictions-accordion';
import { AssignPairDialog } from '@/components/custom-dialogs/assign-breeding-pair-dialog';
import { GoalModeSwitcher } from '@/components/custom-dialogs/goal-mode-switcher-dialog';
import { RefreshCw, Loader2, Award } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

type GoalDetailClientProps = {
    goal: EnrichedResearchGoal;
    initialPredictions: Prediction[];
    allCreatures: EnrichedCreature[];
    allPairs: EnrichedBreedingPair[];
};

export function GoalDetailClient({
    goal,
    initialPredictions,
    allCreatures,
    allPairs,
}: GoalDetailClientProps) {
    const hasMounted = useMounted();
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [imageUrl, setImageUrl] = useState(goal?.imageUrl ?? '');
    const [excludeGender, setExcludeGender] = useState(false);

    const geneEntries = goal?.genes ? Object.entries(goal.genes) : [];
    const gender = goal?.genes['Gender'].phenotype;

    const assignedPredictions = useMemo(() => {
        const assignedIds = new Set(goal?.assignedPairIds || []);
        return initialPredictions.filter((p) => assignedIds.has(p.pairId!));
    }, [initialPredictions, goal?.assignedPairIds]);

    const allAssignedProgeny = useMemo(() => {
        const assignedPairIds = new Set(goal?.assignedPairIds || []);
        const progenyWithPairInfo = allPairs
            .filter((p) => assignedPairIds.has(p.id))
            .flatMap((p) =>
                (p.progeny || [])
                    .filter((prog) => prog.growthLevel === 3)
                    .map((prog) => ({
                        ...prog,
                        parentPairName: p.pairName || 'Unnamed Pair',
                    }))
            );

        // Deduplicate progeny in case it's part of multiple assigned pairs
        const uniqueProgeny = Array.from(
            new Map(progenyWithPairInfo.map((p) => [p.id, p])).values()
        );

        return uniqueProgeny;
    }, [allPairs, goal?.assignedPairIds]);

    const analyzeProgenyAgainstGoal = (
        creature: EnrichedCreature,
        goal: EnrichedResearchGoal,
        excludeGender: boolean
    ): {
        score: number;
        nonMatchingGenes: {
            category: string;
            creatureValue: string;
            goalValue: string;
        }[];
    } => {
        const goalGenes = goal.genes;
        if (!goalGenes || Object.keys(goalGenes).length === 0) {
            return { score: 0, nonMatchingGenes: [] };
        }

        const creatureGenes = (creature.geneData || []).reduce(
            (acc, gene) => {
                acc[gene.category] = gene;
                return acc;
            },
            {} as Record<
                string,
                { category: string; genotype: string; phenotype: string }
            >
        );

        let totalTraits = 0;
        let matchedTraits = 0;
        const nonMatchingGenes: {
            category: string;
            creatureValue: string;
            goalValue: string;
        }[] = [];

        for (const category in goalGenes) {
            if (Object.prototype.hasOwnProperty.call(goalGenes, category)) {
                if (excludeGender && category === 'Gender') {
                    continue;
                }
                totalTraits++;
                const goalGene = goalGenes[category];
                const creatureGene = creatureGenes[category];
                const goalValue =
                    goal.goalMode === 'genotype'
                        ? goalGene.genotype
                        : goalGene.phenotype;

                if (!creatureGene) {
                    nonMatchingGenes.push({
                        category,
                        creatureValue: 'N/A',
                        goalValue,
                    });
                    continue;
                }

                const creatureValue =
                    goal.goalMode === 'genotype'
                        ? creatureGene.genotype
                        : creatureGene.phenotype;

                if (goal.goalMode === 'genotype') {
                    if (creatureGene.genotype === goalGene.genotype) {
                        matchedTraits++;
                    } else {
                        nonMatchingGenes.push({
                            category,
                            creatureValue,
                            goalValue,
                        });
                    }
                } else {
                    if (creatureGene.phenotype === goalGene.phenotype) {
                        matchedTraits++;
                    } else {
                        nonMatchingGenes.push({
                            category,
                            creatureValue,
                            goalValue,
                        });
                    }
                }
            }
        }

        const score =
            totalTraits === 0 ? 100 : (matchedTraits / totalTraits) * 100;
        return { score, nonMatchingGenes };
    };

    const getMatchScoreStyle = (score: number): React.CSSProperties => {
        const hue = (score / 100) * 120; // 0 is red, 120 is green
        return { color: `hsl(${hue}, 90%, 40%)` };
    };

    const scoredProgeny = useMemo(() => {
        return allAssignedProgeny
            .map((p) => ({
                ...p,
                analysis: analyzeProgenyAgainstGoal(p, goal, excludeGender),
            }))
            .sort((a, b) => b.analysis.score - a.analysis.score);
    }, [allAssignedProgeny, goal, excludeGender]);

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
    const handleRefreshImage = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch(
                `/api/research-goals/${goal.id}/refresh-image`,
                {
                    method: 'POST',
                }
            );
            if (!response.ok) {
                throw new Error('Failed to refresh image.');
            }
            const data = await response.json();
            setImageUrl(data.imageUrl); // Update local state to show new image immediately
            router.refresh(); // Re-fetch server components
        } catch (error) {
            Sentry.captureException(error);
            // Optionally show a toast notification on error
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex-col gap-4">
                <h1 className="text-4xl font-bold text-pompaca-purple dark:text-purple-300">
                    Goal: {goal?.name}
                </h1>
                <div className="mt-5">
                    <GoalModeSwitcher goal={goal} />
                </div>
            </div>
            {/* Top Section: Goal Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 border-border">
                    <CardContent className="p-6 grid grid-cols-2 gap-6 items-center">
                        <div className="text-lg font-semibold">
                            <span>Species:</span>{' '}
                            <span className="text-lg font-normal">
                                {goal?.species}
                            </span>
                        </div>
                        <div className="text-lg font-semibold">
                            Gender:
                            <span className="text-lg font-normal">
                                {' '}
                                {gender}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2 border-b border-pompaca-purple/50 dark:border-purple-400/50 pb-1">
                                Genotype
                            </h3>
                            <div className="space-y-1 text-sm">
                                {geneEntries
                                    .filter(
                                        ([category]) => category !== 'Gender'
                                    )
                                    .map(([category, gene]) => (
                                        <div key={category}>
                                            <strong>{category}:</strong>{' '}
                                            {gene.genotype}
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2 border-b border-pompaca-purple/50 dark:border-purple-400/50 pb-1">
                                Phenotype
                            </h3>
                            <div className="space-y-1 text-sm">
                                {geneEntries
                                    .filter(
                                        ([category]) => category !== 'Gender'
                                    )
                                    .map(([category, gene]) => (
                                        <div key={category}>
                                            <strong>{category}:</strong>{' '}
                                            {gene.phenotype}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 border-border flex flex-col items-center justify-center p-4">
                    <div className="relative group">
                        <img
                            key={imageUrl}
                            src={imageUrl}
                            alt={goal?.name}
                            className="max-w-full max-h-48 object-contain"
                            onError={() => setImageUrl('')} // Hide if broken
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-8 w-8 rounded-full bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleRefreshImage}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
            {/* Bottom Section */}
            <div className="mt-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300">
                        Breeding Pairs
                    </h2>
                    <AssignPairDialog
                        goal={goal}
                        predictions={initialPredictions}
                    >
                        <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950">
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
                        <div className="h-16 bg-ebena-lavender dark:bg-pompaca-purple rounded-lg animate-pulse"></div>
                    </div>
                )}
            </div>

            {/* Progeny Analysis Section */}
            <div className="mt-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300">
                        Progeny Analysis
                    </h2>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="excludeGender"
                            checked={excludeGender}
                            onCheckedChange={(checked) =>
                                setExcludeGender(!!checked)
                            }
                        />
                        <Label htmlFor="excludeGender">Exclude Gender</Label>
                    </div>
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
                                                {progeny.analysis.score ===
                                                    100 && (
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
                                        {progeny.analysis.nonMatchingGenes
                                            .length > 0 && (
                                            <div className="mt-2 pl-16 text-xs space-y-1">
                                                <p className="font-semibold text-dusk-purple dark:text-purple-400">
                                                    Mismatched Traits:
                                                </p>
                                                <ul className="list-disc list-inside text-dusk-purple dark:text-purple-400">
                                                    {progeny.analysis.nonMatchingGenes.map(
                                                        (gene) => (
                                                            <li
                                                                key={
                                                                    gene.category
                                                                }
                                                            >
                                                                <span className="font-medium text-pompaca-purple dark:text-purple-300">
                                                                    {
                                                                        gene.category
                                                                    }
                                                                    :
                                                                </span>{' '}
                                                                {
                                                                    gene.creatureValue
                                                                }{' '}
                                                                (Goal:{' '}
                                                                {gene.goalValue}
                                                                )
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
                                No progeny have been logged for the assigned
                                pairs.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Note Section */}
            <div className="flex w-full justify-center">
                <span className="text-s text-dusk-purple dark:text-purple-400 text-center py-5">
                    Note: Some features are still under development and not yet
                    available.
                </span>
            </div>
        </div>
    );
}
