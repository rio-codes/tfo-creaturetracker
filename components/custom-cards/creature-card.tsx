'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronUp, ChevronDown, Pin, PinOff, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import type {
    EnrichedBreedingPair,
    EnrichedResearchGoal,
    EnrichedCreature,
    DbBreedingPair,
    DbBreedingLogEntry,
} from '@/types';
import { ManageBreedingPairsDialog } from '../custom-dialogs/manage-breeding-pairs-dialog';
import { BreedingPairCard } from './breeding-pair-card';
import { LogAsProgenyDialog } from '../custom-dialogs/log-as-progeny-dialog';

interface CreatureCardProps {
    creature: EnrichedCreature;
    allCreatures?: EnrichedCreature[];
    allEnrichedPairs?: EnrichedBreedingPair[];
    allRawPairs?: DbBreedingPair[];
    allLogs?: DbBreedingLogEntry[];
    allGoals?: EnrichedResearchGoal[];
    isAdminView?: boolean;
}

const ParentGeneSummary = ({ creature }: { creature: EnrichedCreature | null }) => {
    if (!creature?.geneData || creature.geneData.length === 0) {
        return <p className="text-xs text-dusk-purple h-4">&nbsp;</p>; // Keep layout consistent
    }
    const summary = creature.geneData
        .filter((g) => g.category !== 'Gender')
        .map((gene) => `<strong>${gene.category}:</strong> ${gene.phenotype} (${gene.genotype})`)
        .join(', ');

    return (
        <p
            className="pt-1 text-xs text-dusk-purple break-words"
            dangerouslySetInnerHTML={{ __html: summary }}
            title={summary.replace(/<strong>/g, '').replace(/<\/strong>/g, '')}
        />
    );
};

const getCacheBustedImageUrl = (creature: EnrichedCreature | null | undefined) => {
    if (!creature?.imageUrl) {
        return '';
    }

    if (creature.updatedAt) {
        return `${creature.imageUrl}?v=${new Date(creature.updatedAt).getTime()}`;
    }
    return creature.imageUrl;
};

export function CreatureCard({
    creature,
    allCreatures,
    allEnrichedPairs,
    allRawPairs,
    allLogs,
    allGoals,
    isAdminView = false,
}: CreatureCardProps) {
    if (!creature) {
        return null;
    }

    const router = useRouter();
    const [isPinned, setIsPinned] = useState(creature.isPinned);
    const [isPinning, setIsPinning] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const parentPair = useMemo(() => {
        if (isAdminView || !allEnrichedPairs) return undefined;
        return allEnrichedPairs.find((p) => p?.progeny?.some((prog) => prog?.id === creature.id));
    }, [allEnrichedPairs, creature.id, isAdminView]);

    const handlePinToggle = async () => {
        setIsPinning(true);
        const newPinState = !isPinned;
        try {
            const response = await fetch(`/api/creatures/${creature.id}/pin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: newPinState }),
            });
            if (!response.ok) {
                throw new Error('Failed to update pin status.');
            }
            setIsPinned(newPinState);
            router.push('/collection');
        } catch (error) {
            console.error(error);
            alert('Could not update pin status. Please try again.');
        } finally {
            setIsPinning(false);
        }
    };

    const handleRemoveFromCollection = async () => {
        if (
            !window.confirm(
                `Are you sure you want to remove "${
                    creature.creatureName || creature.code
                }" from your collection? This cannot be undone.`
            )
        ) {
            return;
        }
        setIsDeleting(true);
        try {
            const apiUrl = isAdminView
                ? `/api/admin/creatures/${creature.id}`
                : `/api/creatures/${creature.id}`;

            const response = await fetch(apiUrl, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to remove the creature.');
            }
            // Reload the page to ensure the underlying admin table is updated.
            window.location.reload();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 border-border overflow-hidden overscroll-y-contain drop-shadow-md drop-shadow-gray-500">
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
                {/* Creature Image */}
                <div className="rounded-lg p-4 mb-4 flex justify-center">
                    <img
                        src={creature.imageUrl || '/images/misc/placeholder.png'}
                        alt={creature.code + ', ' + creature.species}
                        className="w-35 h-35 object-scale-down"
                    />
                </div>
                <div className="flex-col text-sm h-30">
                    <div>
                        <strong>Name:</strong> {creature.creatureName}
                    </div>
                    <div>
                        <strong>Code:</strong> {creature.code}
                    </div>
                    <div>
                        <strong>Species:</strong> {creature.species}
                    </div>
                    <div>
                        <strong>Gender:</strong> {creature.gender}
                    </div>
                    {!isAdminView && (
                        <div className="text-sm">
                            <strong>Parents:</strong>{' '}
                            {parentPair ? (
                                <Dialog>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <DialogTrigger asChild>
                                                    <span className="underline decoration-dotted cursor-pointer">
                                                        {parentPair.pairName}
                                                    </span>
                                                </DialogTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent className="p-0 border-0 bg-transparent max-w-md w-full hidden md:block">
                                                <Card className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 overflow-hidden flex flex-col border-border drop-shadow-md drop-shadow-gray-500 h-full">
                                                    {/* Header Section */}
                                                    <div className="relative p-4">
                                                        {/* Title */}
                                                        <h3
                                                            className="text-xl font-bold text-center"
                                                            title={parentPair.pairName}
                                                        >
                                                            {parentPair.pairName}
                                                        </h3>
                                                        {/* Parent Images */}
                                                        <div className="flex justify-center items-center gap-2 mt-2">
                                                            <img
                                                                src={getCacheBustedImageUrl(
                                                                    parentPair.maleParent
                                                                )}
                                                                alt={parentPair.maleParent!.code}
                                                                className="w-30 h-30 object-contain bg-blue-100 p-1 border-2 border-pompaca-purple rounded-lg"
                                                            />
                                                            <X className="text-dusk-purple" />
                                                            <img
                                                                src={getCacheBustedImageUrl(
                                                                    parentPair.femaleParent
                                                                )}
                                                                alt={parentPair.femaleParent!.code}
                                                                className="w-30 h-30 object-contain bg-pink-100 p-1 border-2 border-pompaca-purple rounded-lg"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Content Section */}
                                                    <CardContent className="flex flex-col items-center flex-grow gap-4 p-4 pt-0 text-pompaca-purple dark:text-purple-300">
                                                        {/* Parent Details */}
                                                        <div className="px-2 text-center text-md text-pompaca-purple dark:text-purple-300">
                                                            <Collapsible>
                                                                <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-left">
                                                                    <p className="truncate">
                                                                        <span className="font-semibold text-pompaca-purple dark:text-purple-300">
                                                                            M:
                                                                        </span>{' '}
                                                                        {parentPair.maleParent!
                                                                            .creatureName ||
                                                                            'Unnamed'}{' '}
                                                                        (
                                                                        {
                                                                            parentPair.maleParent!
                                                                                .code
                                                                        }
                                                                        )
                                                                    </p>
                                                                    <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                                                </CollapsibleTrigger>
                                                                <CollapsibleContent>
                                                                    <ParentGeneSummary
                                                                        creature={
                                                                            parentPair.maleParent
                                                                        }
                                                                    />
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                            <Collapsible>
                                                                <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-left">
                                                                    <p className="truncate">
                                                                        <span className="font-semibold text-pompaca-purple dark:text-purple-300">
                                                                            F:
                                                                        </span>{' '}
                                                                        {parentPair.femaleParent!
                                                                            .creatureName ||
                                                                            'Unnamed'}{' '}
                                                                        (
                                                                        {
                                                                            parentPair.femaleParent!
                                                                                .code
                                                                        }
                                                                        )
                                                                    </p>
                                                                    <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                                                </CollapsibleTrigger>
                                                                <CollapsibleContent>
                                                                    <ParentGeneSummary
                                                                        creature={
                                                                            parentPair.femaleParent
                                                                        }
                                                                    />
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                        </div>
                                                        <div className="text-center text-sm text-pompaca-purple">
                                                            Bred {parentPair.timesBred} times
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <DialogContent className="p-0 border-0 bg-transparent max-w-md w-full sm:max-w-md ">
                                        <BreedingPairCard
                                            pair={parentPair}
                                            allCreatures={allCreatures!}
                                            allGoals={allGoals!}
                                            allPairs={allRawPairs!}
                                            allLogs={allLogs!}
                                            _isAdminView={isAdminView}
                                        />
                                    </DialogContent>
                                </Dialog>
                            ) : (
                                'Unknown'
                            )}
                        </div>
                    )}
                </div>
                <div className="h-5 text-sm">
                    <strong>Genetics:</strong>
                </div>
                <div>
                    <ScrollArea className="h-32 mb-4 relative rounded-md border border-pompaca-purple/30 p-4 bg-ebena-lavender/20 dark:bg-midnight-purple/50">
                        <div className="text-sm space-y-1 ">
                            <div className="whitespace-pre-line pr-4">
                                {creature.geneData && creature.geneData.length > 0 ? (
                                    <div className="pl-2 text-dusk-purple dark:text-purple-400 text-xs font-mono mt-1 space-y-1">
                                        {creature.geneData.map(
                                            (gene) =>
                                                gene && (
                                                    <div key={gene.category}>
                                                        <span className="font-bold text-pompaca-purple dark:text-purple-300">
                                                            {gene.category}:
                                                        </span>
                                                        <div className="pl-2">
                                                            <div>Phenotype: {gene.phenotype}</div>
                                                            <div>Genotype: {gene.genotype}</div>
                                                        </div>
                                                    </div>
                                                )
                                        )}
                                    </div>
                                ) : (
                                    <p>Unknown</p>
                                )}
                            </div>
                        </div>
                        <ScrollBar orientation="vertical" />
                        <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple">
                            <ChevronUp className=" h-4 w-4 text-barely-lilac" />
                            <ChevronDown className="h-4 w-4 text-barely-lilac" />
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center justify-center p-2 pt-0">
                <div className="flex min-w-0 gap-2 justify-center text-sm">
                    {!isAdminView && allCreatures && allEnrichedPairs && allLogs && allGoals && (
                        <>
                            <ManageBreedingPairsDialog
                                baseCreature={creature}
                                allCreatures={allCreatures}
                                allPairs={allEnrichedPairs}
                                allGoals={allGoals}
                                allRawPairs={allRawPairs as any}
                                allLogs={allLogs}
                            >
                                <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-13 w-18 md:w-30 text-xs/tight ">
                                    <span className="w-28 text-wrap wrap-normal flex-wrap">
                                        Manage Breeding Pairs
                                    </span>
                                </Button>
                            </ManageBreedingPairsDialog>
                            <LogAsProgenyDialog
                                creature={creature}
                                allCreatures={allCreatures}
                                allEnrichedPairs={allEnrichedPairs!}
                                allLogs={allLogs}
                            >
                                <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-13 w-18 md:w-30 text-xs/tight">
                                    <span className="w-28 text-wrap wrap-normal">
                                        Log as Progeny
                                    </span>
                                </Button>
                            </LogAsProgenyDialog>
                        </>
                    )}
                    <Button
                        onClick={handleRemoveFromCollection}
                        className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-13 w-18 md:w-30 text-xs/tight"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <span className="w-28 text-wrap wrap-normal">
                                Remove from Collection
                            </span>
                        )}
                    </Button>
                </div>
                <Link
                    href={`https://finaloutpost.net/view/${creature!.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span className="mt-3 text-md font-semibold text-dusk-purple dark:text-purple-400 text-center py-2 hover:underline">
                        View on TFO
                    </span>
                </Link>
            </CardFooter>
        </Card>
    );
}
