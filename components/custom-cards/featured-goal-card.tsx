'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import type { EnrichedResearchGoal, DbCreature, User as DbUser } from '@/types';
import type { FeaturedGoalProgress } from '@/app/[username]/page';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Award,
    ChevronUp,
    ChevronDown,
    Loader2,
    UserRoundMinus,
    UserRoundPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { ResponsiveCreatureLink } from '../misc-custom-components/responsive-creature-link';

interface FeaturedGoalCardProps {
    goal: EnrichedResearchGoal;
    achievement?: { creature: DbCreature } | null;
    currentUser?: DbUser | null;
    username?: string;
    progress?: FeaturedGoalProgress;
}

export function FeaturedGoalCard({
    goal,
    achievement,
    currentUser,
    username,
    progress,
}: FeaturedGoalCardProps) {
    const router = useRouter();
    const [isFeaturing, setIsFeaturing] = useState(false);
    const [isFeatured, setIsFeatured] = useState(
        currentUser?.featuredGoalIds?.includes(goal.id) ?? false
    );
    const geneEntries = Object.entries(goal.genes);

    const handleFeatureToggle = async () => {
        if (!currentUser) return;
        setIsFeaturing(true);

        const currentFeaturedIds = currentUser.featuredGoalIds || [];
        const newIsFeatured = !isFeatured;

        const newFeaturedIds = newIsFeatured
            ? [...currentFeaturedIds, goal.id]
            : currentFeaturedIds.filter((id) => id !== goal.id);

        if (newFeaturedIds.length > 3) {
            toast.error('You can only feature up to 3 research goals.');
            setIsFeaturing(false);
            return;
        }

        try {
            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featuredGoalIds: newFeaturedIds }),
            });
            if (!response.ok) throw new Error('Failed to update featured goals.');
            setIsFeatured(newIsFeatured);
            toast.success(newIsFeatured ? 'Goal featured on profile!' : 'Goal un-featured.');
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsFeaturing(false);
        }
    };

    return (
        <Card className="relative h-full transition-transform transform hover:scale-105 hover:shadow-lg  bg-dusk-purple text-barely-lilac dark:bg-midnight-purple border-pompaca-purple/30 flex flex-col drop-shadow-md drop-shadow-gray-500 dark:drop-shadow-gray-900">
            {currentUser && (
                <div className="absolute top-2 right-2 z-10">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleFeatureToggle}
                                    disabled={isFeaturing}
                                    className="h-8 w-8 rounded-full hover:bg-pompaca-purple/20"
                                >
                                    {isFeaturing ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : isFeatured ? (
                                        <UserRoundMinus className="h-5 w-5 text-pompaca-purple dark:text-purple-300" />
                                    ) : (
                                        <UserRoundPlus className="h-5 w-5 text-dusk-purple dark:text-purple-400" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {isFeatured ? 'Un-feature from profile' : 'Feature on profile'}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}
            <CardContent className="p-4 flex-grow flex flex-col sm:flex-row gap-4 text-pompaca-purple dark:text-barely-lilac">
                <img
                    src={goal.imageUrl || '/images/misc/placeholder.png'}
                    alt={goal.name}
                    className="h-32 w-32 p-3 object-contain rounded-md bg-white/10"
                />
                <div className="flex-1">
                    <CardTitle
                        className="text-lg truncate text-pompaca-purple dark:text-purple-300"
                        title={goal.name}
                    >
                        {goal.name}
                    </CardTitle>
                    <div className="text-sm text-pompaca-purple dark:text-purple-400">
                        <p>
                            <strong>Species:</strong> {goal.species}
                        </p>
                    </div>
                    <div className="mt-2">
                        <p className="text-sm font-semibold text-pompaca-purple dark:text-purple-300">
                            Target Genes:
                        </p>
                        <ScrollArea className="h-24 mt-1 relative rounded-md border border-pompaca-purple/30 p-2  dark:bg-midnight-purple/50">
                            <div className="text-xs font-mono space-y-1 text-pompaca-purple dark:text-purple-400">
                                {geneEntries.map(([category, geneData]) => (
                                    <div key={category}>
                                        <span className="font-bold text-pompaca-purple dark:text-purple-300">
                                            {category}:
                                        </span>
                                        <div className="pl-2">
                                            <div>Phenotype: {geneData.phenotype}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <ScrollBar orientation="vertical" />
                            <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple">
                                <ChevronUp className=" h-4 w-4 text-barely-lilac" />
                                <ChevronDown className="h-4 w-4 text-barely-lilac" />
                            </div>
                        </ScrollArea>
                    </div>
                    <div className="mt-4 text-sm text-pompaca-purple dark:text-purple-400">
                        {achievement ? (
                            <p className="font-semibold text-green-600 dark:text-green-400">
                                <Award className="inline-block mr-2 h-5 w-5 text-yellow-500" />
                                {username} has achieved this goal with{' '}
                                <ResponsiveCreatureLink
                                    displayText={
                                        achievement.creature.creatureName ||
                                        achievement.creature.code
                                    }
                                    code={achievement.creature.code}
                                    imageUrl={achievement.creature.imageUrl}
                                    updatedAt={achievement.creature.updatedAt}
                                />
                                !
                            </p>
                        ) : progress ? (
                            <div className="space-y-2 text-xs">
                                <p>
                                    <strong>Assigned Pairs:</strong> {progress.assignedPairCount}
                                </p>
                                {progress.highestScoringPair && (
                                    <div>
                                        <p>
                                            <strong>Top Pair:</strong>{' '}
                                            {progress.highestScoringPair.name} (
                                            {(progress.highestScoringPair.score * 100).toFixed(2)}%
                                            match)
                                        </p>
                                        <div className="pl-2 italic text-xxs">
                                            <ResponsiveCreatureLink
                                                displayText={
                                                    progress.highestScoringPair.maleParentName
                                                }
                                                code={progress.highestScoringPair.maleParentCode}
                                                imageUrl={
                                                    progress.highestScoringPair.maleParentImageUrl
                                                }
                                                updatedAt={
                                                    progress.highestScoringPair.maleParentUpdatedAt
                                                }
                                            />
                                            [{progress.highestScoringPair.maleParentCode}] x{' '}
                                            <ResponsiveCreatureLink
                                                displayText={
                                                    progress.highestScoringPair.femaleParentName
                                                }
                                                code={progress.highestScoringPair.femaleParentCode}
                                                imageUrl={
                                                    progress.highestScoringPair.femaleParentImageUrl
                                                }
                                                updatedAt={
                                                    progress.highestScoringPair
                                                        .femaleParentUpdatedAt
                                                }
                                            />
                                            [{progress.highestScoringPair.femaleParentCode}]
                                        </div>
                                    </div>
                                )}
                                <p>
                                    <strong>Total Progeny:</strong> {progress.progenyCount}
                                </p>
                                {progress.closestProgeny && (
                                    <div>
                                        <strong>Closest Match: </strong>
                                        <ResponsiveCreatureLink
                                            displayText={`${progress.closestProgeny.name} (${progress.closestProgeny.code})`}
                                            code={progress.closestProgeny.code}
                                            imageUrl={progress.closestProgeny.imageUrl}
                                            updatedAt={progress.closestProgeny.updatedAt}
                                        />{' '}
                                        ({(progress.closestProgeny.accuracy * 100).toFixed(2)}%
                                        accuracy)
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="italic">
                                Breeding progress information will be shown here.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
