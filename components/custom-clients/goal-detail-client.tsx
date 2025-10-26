'use client';

import React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { useRouter } from 'next/navigation';
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    Prediction,
    EnrichedBreedingPair,
} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PredictionsAccordion } from '@/components/misc-custom-components/predictions-accordion';
import { GoalModeSwitcher } from '@/components/custom-dialogs/goal-mode-switcher-dialog';
import { RefreshCw, Loader2, Award, Info, Search } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { InfoDisplay } from '../misc-custom-components/info-display';
import { ShareGoalButton } from '../misc-custom-components/share-goal-button';
import { analyzeProgenyAgainstGoal } from '@/lib/goal-analysis';
import { ManageGoalPairsDialog } from '../custom-dialogs/manage-goal-pairs-dialog';
import { FindPotentialPairsDialog } from '@/components/custom-dialogs/find-potential-pairs-dialog';
import { ResponsiveCreatureLink } from '../misc-custom-components/responsive-creature-link';
import { SuggestedParents } from '../misc-custom-components/suggested-parents';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { CreatureCard } from '@/components/custom-cards/creature-card';

type GoalDetailClientProps = {
    goal: EnrichedResearchGoal;
    initialPredictions: Prediction[];
    availableCreatures: EnrichedCreature[];
};

export function GoalDetailClient({
    goal,
    initialPredictions,
    availableCreatures,
}: GoalDetailClientProps) {
    const hasMounted = useMounted();
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [imageUrl, setImageUrl] = useState(goal?.imageUrl ?? '');
    const [excludeGender, setExcludeGender] = useState(false);
    const [allPairs, setAllPairs] = useState<EnrichedBreedingPair[]>([]);
    const [isFindingPairs, setIsFindingPairs] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    useEffect(() => {
        if (goal) {
            setImageUrl(goal.imageUrl ?? '');
        }
    }, [goal]);

    useEffect(() => {
        const fetchAllPairs = async () => {
            try {
                const response = await fetch('/api/breeding-pairs');
                if (!response.ok) {
                    throw new Error('Failed to fetch breeding pairs.');
                }
                const data = await response.json();
                setAllPairs(data);
            } catch (error) {
                console.error('Error fetching all breeding pairs:', error);
            }
        };

        fetchAllPairs();
    }, []);

    const geneEntries = goal?.genes ? Object.entries(goal.genes) : [];
    const gender = goal?.genes['Gender'].phenotype;

    const goalModeInfoContent = (
        <div className="p-2 max-w-xs dark:text-barely-lilac hallowsnight:text-cimo-crimson text-pompaca-purple">
            <h4 className="font-bold mb-2 border-b pb-1">Goal Modes</h4>
            <div className="space-y-3 mt-2">
                <div>
                    <p className="font-semibold">🧬 Genotype Mode</p>
                    <p className="text-sm">
                        Calculates odds for achieving an exact genetic code. Match scores will be
                        much lower. For advanced users aiming for specific breeding outcomes.
                    </p>
                </div>
                <div>
                    <p className="font-semibold">🪶 Phenotype Mode</p>
                    <p className="text-sm">
                        Calculates odds based on achieving a desired look (e.g., &#34;Steppes&#34;),
                        accepting any genotype that produces it. Match scores will be higher and
                        &#34;possible&#34; goals more common. Recommended for most users.
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
            .filter((p: EnrichedBreedingPair) => assignedPairIds.has(p.id))
            .flatMap((p: EnrichedBreedingPair) =>
                (p?.progeny || [])
                    .filter((prog) => prog && prog.growthLevel === 3)
                    .map((prog) => ({
                        ...prog,
                        parentPairName: p.pairName || 'Unnamed Pair',
                    }))
            );

        const uniqueProgeny = Array.from(
            new Map(progenyWithPairInfo.map((p) => [p.id, p])).values()
        ) as (EnrichedCreature & { parentPairName: string })[];

        return uniqueProgeny.filter(
            (p): p is EnrichedCreature & { parentPairName: string } => !!p.id
        );
    }, [allPairs, goal?.assignedPairIds]);

    const immatureProgeny = useMemo(() => {
        const assignedPairIds = new Set(goal?.assignedPairIds || []);
        const progenyWithPairInfo = allPairs
            .filter((p) => assignedPairIds.has(p.id))
            .flatMap((p) =>
                (p.progeny || [])
                    .filter((prog) => prog && (prog.growthLevel === 1 || prog.growthLevel === 2))
                    .map((prog) => ({
                        ...prog,
                        parentPairName: p.pairName || 'Unnamed Pair',
                    }))
            );

        const uniqueProgeny = Array.from(
            new Map(progenyWithPairInfo.map((p) => [p.id, p])).values()
        ) as EnrichedCreature[];

        return uniqueProgeny.filter((p): p is EnrichedCreature => !!p?.id);
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
            const response = await fetch(`/api/research-goals/${goal.id}/refresh-image`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to refresh image.');
            }
            const data = await response.json();
            setImageUrl(data.imageUrl);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="space-y-8">
            <meta property="og:image" content="{imageUrl}" />
            <div className="flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                    <h1 className="min-w-0 text-4xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                        Goal: {goal?.name}
                    </h1>
                    <ShareGoalButton goal={goal} />
                </div>
                <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Desktop: Info on the badge itself. No separate icon. */}
                        <div className="hidden md:flex">
                            <InfoDisplay
                                trigger={<GoalModeSwitcher goal={goal} />}
                                content={goalModeInfoContent}
                            />
                        </div>
                        {/* Mobile: Badge is separate from the info icon. */}
                        <div className="flex items-center gap-2 md:hidden">
                            <GoalModeSwitcher goal={goal} />
                            <InfoDisplay
                                trigger={
                                    <Info className="h-5 w-5 cursor-pointer text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson" />
                                }
                                content={goalModeInfoContent}
                            />
                        </div>
                    </div>
                    <ManageGoalPairsDialog goal={goal}>
                        <Button>Manage Breeding Pairs</Button>
                    </ManageGoalPairsDialog>
                </div>
            </div>
            {/* Top Section: Goal Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-border">
                    <CardContent className="p-6 flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="text-lg font-semibold">
                                <span>Species:</span>{' '}
                                <span className="text-lg font-normal">{goal?.species}</span>
                            </div>
                            <div className="text-lg font-semibold">
                                Gender:
                                <span className="text-lg font-normal"> {gender}</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b-0">
                                        <TableHead className="text-lg">Trait</TableHead>
                                        <TableHead className="text-lg">Phenotype</TableHead>
                                        <TableHead className="text-lg">Genotype</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {geneEntries
                                        .filter(([category]) => category !== 'Gender')
                                        .map(([category, gene], index) => (
                                            <TableRow
                                                key={category}
                                                className={`${index % 2 === 0 ? 'bg-black/5 dark:bg-white/5' : ''} ${gene.isOptional ? 'opacity-70' : ''} border-b-0`}
                                            >
                                                <TableCell className="font-medium">
                                                    {category}
                                                    {gene.isOptional && (
                                                        <>
                                                            <span className="text-xs"> (Opt.)</span>
                                                            {goal.excludedGenes?.[category] && (
                                                                <p className="text-xs text-red-500">
                                                                    Ex:{' '}
                                                                    {goal.excludedGenes[
                                                                        category
                                                                    ].phenotype.join(', ')}
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </TableCell>
                                                <TableCell>{gene.phenotype}</TableCell>
                                                <TableCell>{gene.genotype}</TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-border flex flex-col items-center justify-center p-4">
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
            {/* Suggested Parent Genes Section */}
            <div className="mt-10">
                <h2 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson mb-4">
                    Suggested Parent Genes
                </h2>
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-border">
                    <CardContent className="p-4">
                        <Accordion type="single" collapsible className="w-full">
                            {geneEntries
                                .filter(([, gene]) => !gene.isOptional)
                                .map(
                                    ([category, gene]) =>
                                        category !== 'Gender' && (
                                            <AccordionItem value={category} key={category}>
                                                <AccordionTrigger className="font-semibold text-lg">
                                                    {category}: {gene.phenotype}
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <SuggestedParents
                                                        species={goal.species}
                                                        category={category}
                                                        targetGene={gene}
                                                    />
                                                </AccordionContent>
                                            </AccordionItem>
                                        )
                                )}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
            {/* Available Creatures Section */}
            {availableCreatures.length > 0 && (
                <div className="mt-10">
                    <h2 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson mb-4">
                        Available for Breeding
                    </h2>
                    <p className="text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine mb-4">
                        The following creatures from other users are marked as available for trade
                        or studding and could be useful for this goal.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableCreatures.map(
                            (creature) =>
                                creature && (
                                    <CreatureCard
                                        key={creature.id}
                                        creature={creature}
                                        currentUser={null}
                                        isAdminView={false}
                                    />
                                )
                        )}
                    </div>
                </div>
            )}
            {/* Bottom Section */}
            <div className="mt-10">
                <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center mb-4">
                    <h2 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                        Breeding Pairs
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <FindPotentialPairsDialog
                            goal={goal}
                            open={isFindingPairs}
                            onOpenChange={setIsFindingPairs}
                            onLoadingChange={setIsSearching}
                        />

                        <Button
                            onClick={() => setIsFindingPairs(true)}
                            disabled={isSearching}
                            className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson"
                        >
                            {isSearching ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="mr-2 h-4 w-4" />
                            )}
                            Look for Pairs
                        </Button>
                    </div>
                </div>
                {hasMounted ? (
                    <PredictionsAccordion predictions={assignedPredictions} goal={goal} />
                ) : (
                    <div className="w-full space-y-2">
                        <div className="h-16 bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet rounded-lg animate-pulse"></div>
                    </div>
                )}
            </div>

            {/* Progeny Analysis Section */}
            <div className="mt-10">
                <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center mb-4">
                    <h2 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                        Progeny Analysis
                    </h2>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="excludeGender"
                            checked={excludeGender}
                            onCheckedChange={(checked: boolean) => setExcludeGender(!!checked)}
                        />
                        <Label htmlFor="excludeGender">Exclude Gender</Label>
                    </div>
                </div>
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-border">
                    <CardContent className="p-4">
                        {scoredProgeny.length > 0 ? (
                            <ul className="space-y-3">
                                {scoredProgeny.map((progeny) => (
                                    <li
                                        key={progeny.id}
                                        className="p-3 rounded-md bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss border border-pompaca-purple dark:border-barely-lilac"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <img
                                                    src={getCacheBustedImageUrl(progeny)}
                                                    alt={progeny.creatureName || progeny.code}
                                                    className="w-12 h-12 object-contain rounded-md mr-4 bg-white/10 p-1"
                                                />
                                                <div>
                                                    <p className="font-semibold">
                                                        {progeny.creatureName || 'Unnamed'} (
                                                        {progeny.code}) (G{progeny.generation})
                                                    </p>
                                                    <p className="text-xs text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                                                        From: {progeny.parentPairName}
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
                                                    {progeny.analysis.score.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                        {progeny.analysis.nonMatchingGenes.length > 0 && (
                                            <div className="mt-2 pl-16 text-xs space-y-1">
                                                <p className="font-semibold text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                                                    Mismatched Traits:
                                                </p>
                                                <ul className="list-disc list-inside text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                                                    {progeny.analysis.nonMatchingGenes.map(
                                                        (gene) => (
                                                            <li key={gene.category}>
                                                                <span className="font-medium text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                                                    {gene.category}:
                                                                </span>{' '}
                                                                {gene.creatureValue} (Goal:{' '}
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
                            <p className="text-center text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine italic py-4">
                                No adult progeny have been logged for the assigned pairs.
                            </p>
                        )}
                        {immatureProgeny.length > 0 && (
                            <div
                                className={`mt-4 pt-4 ${scoredProgeny.length > 0 ? 'border-t border-pompaca-purple/20 dark:border-purple-400/30' : ''}`}
                            >
                                <h4 className="font-semibold text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                                    Immature Progeny
                                </h4>
                                <p className="text-xs text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine italic mb-2">
                                    The following progeny will be available for analysis once they
                                    become adults.
                                </p>
                                <ul className="space-y-1 text-sm">
                                    {immatureProgeny.map((progeny) => (
                                        <li
                                            key={progeny!.id}
                                            className="flex justify-between items-center text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson"
                                        >
                                            <ResponsiveCreatureLink
                                                displayText={`${progeny!.creatureName || 'Unnamed'} (${progeny!.code})`}
                                                code={progeny!.code}
                                                imageUrl={progeny!.imageUrl}
                                                updatedAt={progeny!.updatedAt}
                                            />

                                            <span className="text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded-full">
                                                {progeny!.growthLevel === 1
                                                    ? 'Capsule'
                                                    : 'Juvenile'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
