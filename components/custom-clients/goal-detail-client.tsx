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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PredictionsAccordion } from '@/components/misc-custom-components/predictions-accordion';
import { AssignPairDialog } from '@/components/custom-dialogs/assign-breeding-pair-dialog';
import { GoalModeSwitcher } from '@/components/custom-dialogs/goal-mode-switcher-dialog';
import { RefreshCw, Loader2, Award, Info } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { InfoDisplay } from '../misc-custom-components/info-display';
import { ShareGoalButton } from '../misc-custom-components/share-goal-button';
import { analyzeProgenyAgainstGoal } from '@/lib/goal-analysis';

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

    const goalModeInfoContent = (
        <div className="p-2 max-w-xs dark:text-barely-lilac text-pompaca-purple">
            <h4 className="font-bold mb-2 border-b pb-1">Goal Modes</h4>
            <div className="space-y-3 mt-2">
                <div>
                    <p className="font-semibold">🧬 Genotype Mode</p>
                    <p className="text-sm">
                        Calculates odds for achieving an exact genetic code.
                        Match scores will be much lower. For advanced users
                        aiming for specific breeding outcomes.
                    </p>
                </div>
                <div>
                    <p className="font-semibold">🪶 Phenotype Mode</p>
                    <p className="text-sm">
                        Calculates odds based on achieving a desired look (e.g.,
                        "Steppes"), accepting any genotype that produces it.
                        Match scores will be higher and "possible" goals more
                        common. Recommended for most users.
                    </p>
                </div>
            </div>
        </div>
    );

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
                    .filter((prog) => prog && prog.growthLevel === 3)
                    .map((prog) => ({
                        ...prog,
                        parentPairName: p.pairName || 'Unnamed Pair',
                    }))
            );

        // Deduplicate progeny in case it's part of multiple assigned pairs
        const uniqueProgeny = Array.from(
            new Map(progenyWithPairInfo.map((p) => [p.id, p])).values()
        );

        // Final type guard to ensure all items are valid creatures
        return uniqueProgeny.filter(
            (p): p is EnrichedCreature & { parentPairName: string } => !!p.id
        );
    }, [allPairs, goal?.assignedPairIds]);

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

    const getCacheBustedImageUrl = (creature: EnrichedCreature) => {
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
            <meta property="og:image" content="{imageUrl}" />
            <div className="flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                    <h1 className="min-w-0 text-4xl font-bold text-pompaca-purple dark:text-purple-300">
                        Goal: {goal?.name}
                    </h1>
                    <ShareGoalButton goal={goal} />
                </div>
                <div className="mt-5">
                    {/* Desktop: Info on the badge itself */}
                    <div className="hidden md:block">
                        <InfoDisplay
                            trigger={<GoalModeSwitcher goal={goal} />}
                            content={goalModeInfoContent}
                        />
                    </div>

                    {/* Mobile: Badge + separate info icon */}
                    <div className="flex items-center gap-2 md:hidden">
                        <GoalModeSwitcher goal={goal} />
                        <InfoDisplay
                            trigger={
                                <Info className="h-5 w-5 dark:text-barely-lilac text-pompaca-purple cursor-pointer" />
                            }
                            content={goalModeInfoContent}
                        />
                    </div>
                </div>
            </div>
            {/* Top Section: Goal Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 border-border">
                    <CardContent className="p-6 flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-6">
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
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2 border-b border-pompaca-purple/50 dark:border-purple-400/50 pb-1">
                                    Genotype
                                </h3>
                                <div className="space-y-1 text-sm">
                                    {geneEntries
                                        .filter(
                                            ([category]) =>
                                                category !== 'Gender'
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
                                            ([category]) =>
                                                category !== 'Gender'
                                        )
                                        .map(([category, gene]) => (
                                            <div key={category}>
                                                <strong>{category}:</strong>{' '}
                                                {gene.phenotype}
                                            </div>
                                        ))}
                                </div>
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
                <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center mb-4">
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
                    <div className="w-full space-y-2">
                        <div className="h-16 bg-ebena-lavender dark:bg-pompaca-purple rounded-lg animate-pulse"></div>
                    </div>
                )}
            </div>

            {/* Progeny Analysis Section */}
            <div className="mt-10">
                <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center mb-4">
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
        </div>
    );
}
