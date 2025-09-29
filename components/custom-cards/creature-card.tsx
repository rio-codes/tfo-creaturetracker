'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronUp,
    ChevronDown,
    Archive,
    Pin,
    PinOff,
    Loader2,
    X,
    UserRoundPlus,
    UserRoundMinus,
    Trash2,
    Pencil,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
    User,
} from '@/types';
import { ManageBreedingPairsDialog } from '../custom-dialogs/manage-breeding-pairs-dialog';
import { BreedingPairCard } from './breeding-pair-card';
import { LogAsProgenyDialog } from '../custom-dialogs/log-as-progeny-dialog';
import { toast } from 'sonner';
import { SetGenerationDialog } from '../custom-dialogs/set-generation-dialog';
import { sanitizeHtml } from '@/lib/sanitize';

interface CreatureCardProps {
    creature: EnrichedCreature;
    pinnedCreatures: EnrichedCreature[];
    unpinnedCreatures: EnrichedCreature[];
    totalPages: number;
    allCreatures: EnrichedCreature[];
    allRawPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    allEnrichedPairs?: EnrichedBreedingPair[];
    allGoals?: EnrichedResearchGoal[];
    isAdminView?: boolean;
    currentUser?: User | null;
}

const ParentGeneSummary = async ({ creature }: { creature: EnrichedCreature | null }) => {
    if (!creature?.geneData || creature.geneData.length === 0) {
        return <p className="text-xs text-dusk-purple h-4">&nbsp;</p>; // Keep layout consistent
    }
    const summary = creature.geneData
        .filter((g) => g.category !== 'Gender')
        .map((gene) => `<strong>${gene.category}:</strong> ${gene.phenotype} (${gene.genotype})`)
        .join(', ');

    const cleanSummary = await sanitizeHtml(summary);

    return (
        <p
            className="pt-1 text-xs text-dusk-purple break-words"
            dangerouslySetInnerHTML={{ __html: cleanSummary }}
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
    allEnrichedPairs: allPairs,
    allRawPairs,
    allLogs,
    allGoals,
    currentUser,
    isAdminView = false,
}: CreatureCardProps) {
    if (!creature) {
        return null;
    }

    const router = useRouter();
    const [isPinned, setIsPinned] = useState(creature.isPinned);
    const [isPinning, setIsPinning] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFeaturing, setIsFeaturing] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isFeatured, setIsFeatured] = useState(
        currentUser?.featuredCreatureIds?.includes(creature.id) ?? false
    );

    const parentPair = useMemo(
        () => allPairs?.find((p) => p?.progeny?.some((prog) => prog?.id === creature.id)),
        [allPairs, creature.id]
    );

    const isParentOfPair = useMemo(() => {
        return allRawPairs.some(
            (p) => p.maleParentId === creature.id || p.femaleParentId === creature.id
        );
    }, [allRawPairs, creature.id]);

    const isProgeny = !!parentPair;

    const handleFeatureToggle = async () => {
        if (!currentUser) return;
        setIsFeaturing(true);

        const currentFeaturedIds = currentUser.featuredCreatureIds || [];
        const newIsFeatured = !isFeatured;

        const newFeaturedIds = newIsFeatured
            ? [...currentFeaturedIds, creature.id]
            : currentFeaturedIds.filter((id) => id !== creature.id);

        if (newFeaturedIds.length > 3) {
            toast.error('You can only feature up to 3 creatures.');
            setIsFeaturing(false);
            return;
        }

        try {
            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featuredCreatureIds: newFeaturedIds }),
            });
            if (!response.ok) throw new Error('Failed to update featured creatures.');
            setIsFeatured(newIsFeatured);
            toast.success(
                newIsFeatured ? 'Creature featured on profile!' : 'Creature un-featured.'
            );
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsFeaturing(false);
        }
    };

    const handlePinToggle = async () => {
        setIsPinning(true);
        const newPinState = !isPinned;
        try {
            const response = await fetch(`/api/creatures/${creature.id}`, {
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

    const handleArchive = async () => {
        setIsArchiving(true);
        try {
            const response = await fetch(`/api/creatures/${creature.id}/archive`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isArchived: true }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to archive creature.');
            }
            toast.success('Creature archived.');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsArchiving(false);
        }
    };

    const handleDeletePermanently = async () => {
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
            toast.success('Creature deleted permanently.');
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card
            className={`relative bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 border-border overflow-hidden overscroll-y-contain drop-shadow-md drop-shadow-gray-500 ${
                creature.isArchived ? 'opacity-60' : ''
            }`}
        >
            {creature.isArchived && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-2 rounded-full bg-gray-500/80 px-3 py-1 text-white text-xs font-bold">
                    <Archive className="h-4 w-4" />
                    <span>Archived</span>
                </div>
            )}
            <div className="absolute top-1 right-1 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePinToggle}
                    disabled={isPinning || creature.isArchived}
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
            {!isAdminView && currentUser && (
                <div className="absolute bottom-2 right-2 z-10">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleFeatureToggle}
                                    disabled={isFeaturing || creature.isArchived}
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
                            <strong>Parents/Origin:</strong>{' '}
                            {parentPair && (
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
                            )}
                            {parentPair && creature.g1Origin === 'another-lab' && (
                                <span>{' / '}</span>
                            )}
                            {creature.g1Origin === 'another-lab' && <span>{'Another Lab'}</span>}
                            {creature.g1Origin === 'cupboard' && <span>{'Cupboard'}</span>}
                            {creature.g1Origin === 'quest' && <span>{'Quest'}</span>}
                            {creature.g1Origin === 'genome-splicer' && (
                                <span>{'Genome Splicer'}</span>
                            )}
                            {!parentPair && !creature.g1Origin && 'Unknown'}
                            <span>
                                {' (G'}
                                {creature.generation}
                                {!isAdminView && (
                                    <SetGenerationDialog creature={creature}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-2 w-2 p-2 ml-1 text-dusk-purple hover:text-pompaca-purple dark:hover:text-purple-300"
                                            aria-label="Edit generation"
                                        >
                                            <Pencil className="h-2 w-2" />
                                        </Button>
                                    </SetGenerationDialog>
                                )}
                                {')'}
                            </span>
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
            <CardFooter className="flex-col">
                <div className="flex w-full gap-2 justify-center text-sm">
                    {!isAdminView && allCreatures && allPairs && allLogs && allGoals && (
                        <>
                            <ManageBreedingPairsDialog
                                baseCreature={creature}
                                allCreatures={allCreatures}
                                allPairs={allPairs}
                                allGoals={allGoals}
                                allRawPairs={allRawPairs}
                                allLogs={allLogs}
                            >
                                <Button
                                    className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 w-23 h-16"
                                    disabled={creature.isArchived}
                                >
                                    <span className="text-wrap wrap-normal text-sm/tight">
                                        Manage Breeding Pairs
                                    </span>
                                </Button>
                            </ManageBreedingPairsDialog>
                            <LogAsProgenyDialog
                                creature={creature}
                                allCreatures={allCreatures}
                                allEnrichedPairs={allPairs}
                                allLogs={allLogs}
                            >
                                <Button
                                    className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 w-23 h-16"
                                    disabled={creature.isArchived}
                                >
                                    <span className="text-wrap wrap-normal text-sm/tight">
                                        Log as Progeny
                                    </span>
                                </Button>
                            </LogAsProgenyDialog>
                        </>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 w-23 h-16"
                                disabled={isDeleting || isArchiving || creature.isArchived}
                            >
                                <span className="text-wrap wrap-normal gap-y-1 text-sm/tight">
                                    Remove from Collection
                                </span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Remove "{creature.creatureName || creature.code}"?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    You can <strong>archive</strong> this creature to hide it from
                                    your main collection while preserving its data for pedigrees.
                                    {(isParentOfPair || isProgeny) && (
                                        <p className="font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                                            Warning: This creature is part of a breeding pair or is
                                            logged as progeny. Deleting it permanently may break
                                            pedigree links.
                                        </p>
                                    )}
                                    <p className="mt-2">
                                        <strong>Permanent deletion</strong> cannot be undone.
                                    </p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <Button
                                    variant="secondary"
                                    onClick={handleArchive}
                                    disabled={isArchiving || isDeleting}
                                >
                                    {isArchiving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Archive className="mr-2 h-4 w-4" />
                                    )}
                                    Archive
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeletePermanently}
                                    disabled={isArchiving || isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    Delete Permanently
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div>
                    <Link
                        href={`https://finaloutpost.net/view/${creature!.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="mt-3 text-md font-semibold text-dusk-purple dark:text-purple-400 text-center py-2 hover:underline">
                            View on TFO
                        </span>
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
