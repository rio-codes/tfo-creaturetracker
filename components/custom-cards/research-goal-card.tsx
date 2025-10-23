'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Pin,
    PinOff,
    ChevronUp,
    ChevronDown,
    UserRoundPlus,
    UserRoundMinus,
    Loader2,
    Sparkle,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { EnrichedResearchGoal, User } from '@/types/index';
import { EditGoalDialog } from '../custom-dialogs/edit-goal-dialog';
import { Badge } from '@/components/ui/badge';
import { InfoDisplay } from '../misc-custom-components/info-display';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface ResearchGoalCardProps {
    goal: EnrichedResearchGoal;
    isAdminView?: boolean;
    currentUser?: User | null;
}

export function ResearchGoalCard({
    goal,
    isAdminView = false,
    currentUser,
}: ResearchGoalCardProps) {
    const router = useRouter();
    const [isPinned, setIsPinned] = useState(goal?.isPinned);
    const [isPinning, setIsPinning] = useState(false);
    const [isFeaturing, setIsFeaturing] = useState(false);
    const [isFeatured, setIsFeatured] = useState(
        currentUser?.featuredGoalIds?.includes(goal.id) ?? false
    );

    const geneEntries = goal?.genes ? Object.entries(goal.genes) : [];

    const handlePinToggle = async () => {
        setIsPinning(true);
        const newPinState = !isPinned;

        try {
            const response = await fetch(`/api/research-goals/${goal?.id}/pin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: newPinState }),
            });

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

    const handleFeatureToggle = async () => {
        if (!currentUser) return;
        setIsFeaturing(true);

        const currentFeaturedIds = currentUser.featuredGoalIds || [];
        const newIsFeatured = !isFeatured;

        const newFeaturedIds = newIsFeatured
            ? [...currentFeaturedIds, goal.id]
            : currentFeaturedIds.filter((id: string) => id !== goal.id);

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

    const handlePublicToggle = async () => {
        setIsTogglingPublic(true);
        try {
            const response = await fetch(`/api/research-goals/${goal.id}/toggle-wishlist`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublic: !isPublic }),
            });
            if (!response.ok) throw new Error('Failed to update public status.');
            setIsPublic(!isPublic);
            toast.success(
                !isPublic ? 'Goal added to Community Wishlist!' : 'Goal removed from Wishlist.'
            );
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsTogglingPublic(false);
        }
    };

    return (
        <Card className="relative bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson border-border overflow-hidden drop-shadow-md drop-shadow-gray-500">
            {/* Goal Mode Badge */}
            <div className="absolute top-2 left-2 z-10">
                <InfoDisplay
                    trigger={
                        <Badge
                            className={
                                goal?.goalMode === 'genotype'
                                    ? 'h-auto p-2 capitalize text-center text-sm drop-shadow-md bg-dna-magenta/60 rounded-md border-2 border-pompaca-purple w-30 hallowsnight:text-abyss'
                                    : 'h-auto p-2  capitalize text-center text-sm drop-shadow-md bg-dna-teal/60 rounded-md border-2 border-pompaca-purple w-30 hallowsnight:text-abyss'
                            }
                        >
                            <span>
                                {goal?.goalMode === 'genotype' ? '🧬 Genotype' : '🪶 Phenotype'}
                            </span>
                        </Badge>
                    }
                    content={
                        <>
                            <h4 className="font-bold mb-1">
                                {goal?.goalMode === 'genotype' ? 'Genotype Mode' : 'Phenotype Mode'}
                            </h4>
                            {goal?.goalMode === 'genotype' ? (
                                <p className="dark:text-barely-lilac hallowsnight:text-abyss">
                                    Calculates odds for achieving an exact genetic code. Match
                                    scores will be much lower. For advanced users aiming for
                                    specific breeding outcomes.
                                </p>
                            ) : (
                                <p className="dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                    Calculates odds based on achieving a desired look (e.g.,
                                    &#34;Steppes&#34;), accepting any genotype that produces it.
                                    Match scores will be higher and &#34;possible&#34; goals more
                                    common. Recommended for most users.
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
                    className="h-8 w-8 rounded-full hover:bg-pompaca-purple/20 hallowsnight:text-cimo-crimson hallowsnight:bg-blood-bay-wine"
                >
                    {isPinned ? (
                        <Pin className="h-5 w-5 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson fill-pompaca-purple dark:fill-purple-300" />
                    ) : (
                        <PinOff className="h-5 w-5 text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine" />
                    )}
                </Button>
            </div>

            <div className="absolute top-1 right-10 z-10">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePublicToggle}
                                disabled={isTogglingPublic}
                                className="h-8 w-8 rounded-full hover:bg-pompaca-purple/20"
                            >
                                {isTogglingPublic ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : isPublic ? (
                                    <Sparkles className="h-5 w-5 text-yellow-30" />
                                ) : (
                                    <Sparkle className="h-5 w-5 text-red-700" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isPublic ? 'Remove from Wishlist' : 'Add to Community Wishlist'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {!isAdminView && currentUser && (
                <div className="absolute bottom-2 right-2 z-10">
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
                                        <UserRoundMinus className="h-5 w-5 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson" />
                                    ) : (
                                        <UserRoundPlus className="h-5 w-5 text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine" />
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
            <CardContent className="p-4">
                {/* Goal Image */}
                <div className="bg- rounded-lg p-4 mb-4 flex justify-center hallowsnight:text-cimo-crimson">
                    <img
                        src={goal?.imageUrl || '/images/misc/placeholder.png'}
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
                <ScrollArea className="h-32 mb-4 relative rounded-md border border-pompaca-purple/30 p-4 bg-ebena-lavender/20 dark:bg-midnight-purple hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson">
                    <div className="text-sm text-card-foreground space-y-1">
                        <div className="whitespace-pre-line pr-4">
                            {geneEntries.length > 0 ? (
                                <div className="pl-2 text-dusk-purple hallowsnight:text-cimo-crimson text-xs font-mono mt-1 space-y-1">
                                    {geneEntries.map(([category, geneData]) => (
                                        <div key={category}>
                                            <span className="font-bold text-pompaca-purple hallowsnight:text-cimo-crimson">
                                                {category}:
                                            </span>
                                            <div className="pl-2">
                                                <div>Phenotype: {geneData.phenotype}</div>
                                                <div>
                                                    Genotype:{' '}
                                                    {goal?.goalMode == 'phenotype' &&
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

                    <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple hallowsnight:bg-blood-bay-wine">
                        <ChevronUp className=" h-4 w-4 text-barely-lilac hallowsnight:text-cimo-crimson" />
                        <ChevronDown className="h-4 w-4 text-barely-lilac hallowsnight:text-cimo-crimson" />
                    </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="flex w-full gap-x-2 justify-center">
                    <Link href={`/research-goals/${goal?.id}`} passHref>
                        <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-13 w-30 text-sm/tight hallowsnight:text-cimo-crimson hallowsnight:bg-blood-bay-wine">
                            <span className="text-wrap wrap-normal text-xs">Goal Tracker</span>
                        </Button>
                    </Link>
                    <EditGoalDialog goal={goal} isAdminView={isAdminView} variant="card" />
                </div>
            </CardContent>
        </Card>
    );
}
