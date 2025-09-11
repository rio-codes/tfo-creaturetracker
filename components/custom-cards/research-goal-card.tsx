'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pin, PinOff, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { EnrichedResearchGoal } from '@/types/index';
import { EditGoalDialog } from '../custom-dialogs/edit-goal-dialog';
import { Badge } from '@/components/ui/badge';
import { InfoDisplay } from '../misc-custom-components/info-display';

interface ResearchGoalCardProps {
    goal: EnrichedResearchGoal;
    isAdminView?: boolean;
}

export function ResearchGoalCard({
    goal,
    isAdminView = false,
}: ResearchGoalCardProps) {
    const router = useRouter();
    const [isPinned, setIsPinned] = useState(goal?.isPinned);
    const [isPinning, setIsPinning] = useState(false);

    const geneEntries = goal?.genes ? Object.entries(goal.genes) : [];

    const handlePinToggle = async () => {
        setIsPinning(true);
        const newPinState = !isPinned;

        try {
            const response = await fetch(
                `/api/research-goals/${goal?.id}/pin`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isPinned: newPinState }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update pin status.');
            }

            setIsPinned(newPinState);
            router.push('/research-goals');
        } catch (error) {
            console.error(error);
            alert('Could not update pin status. Please try again.');
        } finally {
            setIsPinning(false);
        }
    };

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-barely-lilac border-border overflow-hidden drop-shadow-md drop-shadow-gray-500">
            {/* Goal Mode Badge */}
            <div className="absolute top-2 left-2 z-10">
                <InfoDisplay
                    trigger={
                        <Badge
                            className={
                                goal?.goalMode === 'genotype'
                                    ? 'h-auto p-2 capitalize text-center text-sm drop-shadow-md bg-dna-magenta/60 rounded-md border-2 border-pompaca-purple w-30'
                                    : 'h-auto p-2  capitalize text-center text-sm drop-shadow-md bg-dna-teal/60 rounded-md border-2 border-pompaca-purple w-30'
                            }
                        >
                            <span>
                                {goal?.goalMode === 'genotype'
                                    ? '🧬 Genotype'
                                    : '🪶 Phenotype'}
                            </span>
                        </Badge>
                    }
                    content={
                        <>
                            <h4 className="font-bold mb-1">
                                {goal?.goalMode === 'genotype'
                                    ? 'Genotype Mode'
                                    : 'Phenotype Mode'}
                            </h4>
                            {goal?.goalMode === 'genotype' ? (
                                <p className="dark:text-barely-lilac">
                                    Calculates odds for achieving an exact
                                    genetic code. Match scores will be much
                                    lower. For advanced users aiming for
                                    specific breeding outcomes.
                                </p>
                            ) : (
                                <p className="dark:text-barely-lilac">
                                    Calculates odds based on achieving a desired
                                    look (e.g., "Steppes"), accepting any
                                    genotype that produces it. Match scores will
                                    be higher and "possible" goals more common.
                                    Recommended for most users.
                                </p>
                            )}
                        </>
                    }
                />
            </div>
            <div className="absolute top-1 right-1 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePinToggle}
                    disabled={isPinning}
                    aria-label={isPinned ? 'Unpin goal' : 'Pin goal'}
                    className="h-8 w-8 rounded-full hover:bg-pompaca-purple/20"
                >
                    {isPinned ? (
                        <Pin className="h-5 w-5 text-pompaca-purple dark:text-purple-300 fill-pompaca-purple dark:fill-purple-300" />
                    ) : (
                        <PinOff className="h-5 w-5 text-dusk-purple dark:text-purple-400" />
                    )}
                </Button>
            </div>
            <CardContent className="p-4">
                {/* Goal Image */}
                <div className="bg- rounded-lg p-4 mb-4 flex justify-center">
                    <img
                        src={goal?.imageUrl || '/placeholder.png'}
                        alt={goal?.name}
                        className="w-35 h-35 object-scale-down"
                    />
                </div>
                <div className="h-20">
                    <div>
                        <strong>Name:</strong> {goal?.name}
                    </div>
                    <div>
                        <strong>Species:</strong> {goal?.species}
                    </div>
                </div>
                {/* Goal Details in Scrollable Area */}
                <strong>Target Genes:</strong>
                <ScrollArea className="h-32 mb-4 relative rounded-md border border-pompaca-purple/30 p-4 bg-ebena-lavender/20 dark:bg-midnight-purple/50">
                    <div className="text-sm text-card-foreground space-y-1">
                        <div className="whitespace-pre-line pr-4">
                            {geneEntries.length > 0 ? (
                                <div className="pl-2 text-dusk-purple text-xs font-mono mt-1 space-y-1">
                                    {geneEntries.map(([category, geneData]) => (
                                        <div key={category}>
                                            <span className="font-bold text-pompaca-purple">
                                                {category}:
                                            </span>
                                            <div className="pl-2">
                                                <div>
                                                    Phenotype:{' '}
                                                    {geneData.phenotype}
                                                </div>
                                                <div>
                                                    Genotype:{' '}
                                                    {goal?.goalMode ==
                                                        'phenotype' &&
                                                    geneData.isMultiGenotype ? (
                                                        <span>multiple</span>
                                                    ) : (
                                                        geneData.genotype
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No specific genes targeted.</p>
                            )}
                        </div>
                    </div>

                    <ScrollBar orientation="vertical" />

                    {/* Fake Scrollbar Hint */}
                    <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple">
                        <ChevronUp className="h-4 w-4 text-barely-lilac" />
                        <ChevronDown className="h-4 w-4 text-barely-lilac" />
                    </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="flex w-full gap-x-2 justify-center">
                    <Link href={`/research-goals/${goal?.id}`} passHref>
                        <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-16 w-25 text-sm/tight">
                            <span className="text-wrap wrap-normal text-sm/tight">
                                Goal Tracker
                            </span>
                        </Button>
                    </Link>
                    <EditGoalDialog goal={goal} isAdminView={isAdminView} />
                </div>
            </CardContent>
        </Card>
    );
}
