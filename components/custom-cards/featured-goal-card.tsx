import Link from 'next/link';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import type { EnrichedResearchGoal, DbCreature } from '@/types';
import type { FeaturedGoalProgress } from '@/app/[username]/page';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Award, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function ResponsiveCreatureLink({
    displayText,
    code,
    imageUrl,
    className,
}: {
    displayText: string;
    code: string;
    imageUrl: string;
    className?: string;
}) {
    return (
        <>
            {/* Desktop: Tooltip on a link */}
            <span className={`hidden md:inline ${className}`}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href={`https://finaloutpost.net/view/${code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-pompaca-purple dark:hover:text-purple-300"
                            >
                                {displayText}
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                            <img
                                src={imageUrl}
                                alt={displayText}
                                className="w-24 h-24 object-contain rounded-md bg-white/10 p-1"
                            />
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </span>
            {/* Mobile: Popover */}
            <span className={`inline md:hidden ${className}`}>
                <Popover>
                    <PopoverTrigger asChild>
                        <span className="underline cursor-pointer">{displayText}</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <div className="flex flex-col gap-2 items-center">
                            <img
                                src={imageUrl}
                                alt={displayText}
                                className="w-24 h-24 object-contain rounded-md bg-white/10 p-1"
                            />
                            <Link
                                href={`https://finaloutpost.net/view/${code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm underline"
                            >
                                View on TFO <ExternalLink className="h-4 w-4" />
                            </Link>
                        </div>
                    </PopoverContent>
                </Popover>
            </span>
        </>
    );
}

interface FeaturedGoalCardProps {
    goal: EnrichedResearchGoal;
    achievement?: { creature: DbCreature } | null;
    username: string;
    progress?: FeaturedGoalProgress;
}

export function FeaturedGoalCard({ goal, achievement, username, progress }: FeaturedGoalCardProps) {
    const geneEntries = Object.entries(goal.genes);

    return (
        <Card className="h-full transition-transform transform hover:scale-105 hover:shadow-lg  bg-dusk-purple text-barely-lilac dark:bg-midnight-purple border-pompaca-purple/30 flex flex-col drop-shadow-md drop-shadow-gray-500 dark:drop-shadow-gray-900">
            <CardContent className="p-4 flex-grow flex flex-col sm:flex-row gap-4 text-pompaca-purple dark:text-barely-lilac">
                <Link href={`/research-goals/${goal.id}`} className="self-center sm:self-start">
                    <img
                        src={goal.imageUrl || '/images/misc/placeholder.png'}
                        alt={goal.name}
                        className="h-32 w-32 p-3 object-contain rounded-md bg-white/10"
                    />
                </Link>
                <div className="flex-1">
                    <Link href={`/research-goals/${goal.id}`}>
                        <CardTitle
                            className="text-lg truncate text-pompaca-purple dark:text-purple-300 hover:underline"
                            title={goal.name}
                        >
                            {goal.name}
                        </CardTitle>
                    </Link>
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
