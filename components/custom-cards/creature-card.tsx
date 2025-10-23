'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronUp,
    ChevronDown,
    Archive,
    Pin,
    PinOff,
    Loader2,
    UserRoundPlus,
    UserRoundMinus,
    Trash2,
    Sparkles,
    Pencil,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import type { EnrichedBreedingPair, EnrichedResearchGoal, EnrichedCreature, User } from '@/types';
import { ManageBreedingPairsDialog } from '../custom-dialogs/manage-breeding-pairs-dialog';
import { BreedingPairCard } from './breeding-pair-card';
import { LogAsProgenyDialog } from '../custom-dialogs/log-as-progeny-dialog';
import { toast } from 'sonner';
import { SetGenerationDialog } from '../custom-dialogs/set-generation-dialog';

interface CreatureCardProps {
    creature: EnrichedCreature;
    allEnrichedPairs?: EnrichedBreedingPair[];
    allGoals?: EnrichedResearchGoal[];
    isAdminView?: boolean;
    currentUser?: User | null;
}

export function CreatureCard({ creature, currentUser, isAdminView = false }: CreatureCardProps) {
    const router = useRouter();

    if (!creature) {
        return null;
    }

    const [isPinned, setIsPinned] = useState(creature?.isPinned);
    const [isPinning, setIsPinning] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFeaturing, setIsFeaturing] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isFeatured, setIsFeatured] = useState(
        currentUser?.featuredCreatureIds?.includes(creature.id) ?? false
    );
    const [parentPair, setParentPair] = useState<EnrichedBreedingPair | null>(null);
    const [isParentOfPair, setIsParentOfPair] = useState(false);
    const [_isContextLoading, setIsContextLoading] = useState(true);

    useEffect(() => {
        if (isAdminView) {
            setIsContextLoading(false);
            return;
        }

        async function fetchCreatureContext() {
            setIsContextLoading(true);
            const response = await fetch(`/api/creatures/${creature?.id}/context`);
            if (response.ok) {
                const { parentPair, isParentOfPair } = await response.json();
                setParentPair(parentPair);
                setIsParentOfPair(isParentOfPair);
            }
            setIsContextLoading(false);
        }
        fetchCreatureContext();
    }, [creature.id, isAdminView]);

    const isProgeny = !!parentPair;

    const handleFeatureToggle = async () => {
        if (!currentUser) return;
        setIsFeaturing(true);

        const currentFeaturedIds = currentUser.featuredCreatureIds || [];
        const newIsFeatured = !isFeatured;

        const newFeaturedIds = newIsFeatured
            ? [...currentFeaturedIds, creature.id]
            : currentFeaturedIds.filter((id: string) => id !== creature.id);

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
            const archiveState = creature.isArchived;
            const response = await fetch(`/api/creatures/${creature.id}/archive`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isArchived: !creature.isArchived }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to change creature archival state.');
            }
            if (archiveState) {
                toast.success('Creature restored from archive.');
            } else {
                toast.success('Creature archived.');
            }
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
            className={`relative bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-border overflow-hidden overscroll-y-contain drop-shadow-md drop-shadow-gray-500`}
        >
            {currentUser?.showFulfillable && creature.fulfillsWish && (
                <div className="absolute top-2 left-2 z-10">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="p-1.5 bg-yellow-400/80 rounded-full">
                                    <Sparkles className="h-5 w-5 text-yellow-400" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>This creature fulfills a public wishlist goal!</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}
            <div className={`${creature.isArchived ? 'opacity-50' : 'opacity-100'}`}>
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
                        className="h-8 w-8 rounded-full hover:bg-pompaca-purple/20 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson"
                    >
                        {isPinned ? (
                            <Pin className="h-5 w-5 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson fill-pompaca-purple hallowsnight:fill-ruzafolio-scarlet dark:fill-purple-300" />
                        ) : (
                            <PinOff className="h-5 w-5 text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine" />
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
                                            <UserRoundMinus className="h-5 w-5 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson" />
                                        ) : (
                                            <UserRoundPlus className="h-5 w-5 text-dusk-purple dark:text-purple-400 hallowsnight:text-cimo-crimson" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        {isFeatured
                                            ? 'Un-feature from profile'
                                            : 'Feature on profile'}
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
                    <div className="flex-col text-sm h-30 hallowsnight:text-cimo-crimson">
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
                                        <>
                                            {/* Mobile: Opens a Dialog */}
                                            <DialogTrigger asChild>
                                                <span className="underline decoration-dotted cursor-pointer md:hidden">
                                                    {parentPair.pairName}
                                                </span>
                                            </DialogTrigger>

                                            {/* Desktop: Opens a Popover */}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <span className="hidden md:inline underline decoration-dotted cursor-pointer">
                                                        {parentPair.pairName}
                                                    </span>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    side="top"
                                                    className="p-0 border-0 bg-transparent max-w-md w-full"
                                                >
                                                    <BreedingPairCard
                                                        pair={parentPair}
                                                        _isAdminView={isAdminView} // It will fetch its own data
                                                        _isContextView={true}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </>
                                        <DialogContent className="p-0 border-0 bg-transparent max-w-md w-full sm:max-w-md ">
                                            <BreedingPairCard
                                                pair={parentPair}
                                                _isAdminView={isAdminView} // It will fetch its own data
                                                _isContextView={true}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                )}
                                {parentPair && creature.origin === 'another-lab' && (
                                    <span>{' / '}</span>
                                )}
                                {creature.origin === 'unknown' && <span>{'Unknown'}</span>}
                                {creature.origin === 'another-lab' && <span>{'Another Lab'}</span>}
                                {creature.origin === 'cupboard' && <span>{'Cupboard'}</span>}
                                {creature.origin === 'quest' && <span>{'Quest'}</span>}
                                {creature.origin === 'raffle' && <span>{'Raffle'}</span>}
                                {creature.origin === 'genome-splicer' && (
                                    <span>{'Genome Splicer'}</span>
                                )}
                                {!parentPair && !creature.origin && 'Unknown'}
                                <span>
                                    {' (G'}
                                    {creature.generation}
                                    {!isAdminView && (
                                        <SetGenerationDialog creature={creature}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-2 w-2 p-2 ml-1 text-dusk-purple hover:text-pompaca-purple dark:hover:text-purple-300 hallowsnight:text-cimo-crimson"
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
                        <ScrollArea className="h-32 mb-4 relative rounded-md border border-pompaca-purple/30 p-4 bg-ebena-lavender/20 dark:bg-midnight-purple hallowsnight:bg-abyss/50">
                            <div className="text-sm space-y-1 ">
                                <div className="whitespace-pre-line pr-4">
                                    {creature.geneData && creature.geneData.length > 0 ? (
                                        <div className="pl-2 text-dusk-purple dark:text-purple-400 hallowsnight:text-cimo-crimson text-xs font-mono mt-1 space-y-1">
                                            {creature.geneData.map(
                                                (gene) =>
                                                    gene && (
                                                        <div key={gene.category}>
                                                            <span className="font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                                                {gene.category}:
                                                            </span>
                                                            <div className="pl-2">
                                                                <div>
                                                                    Phenotype: {gene.phenotype}
                                                                </div>
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
                            <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple hallowsnight:bg-blood-bay-wine">
                                <ChevronUp className=" h-4 w-4 text-barely-lilac hallowsnight:text-cimo-crimson" />
                                <ChevronDown className="h-4 w-4 text-barely-lilac hallowsnight:text-cimo-crimson" />
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
            </div>
            <CardFooter className="flex flex-col items-center p-4 pt-0">
                <div className="flex w-full justify-center gap-2 text-sm">
                    {!isAdminView && !creature.isArchived ? (
                        <>
                            <ManageBreedingPairsDialog baseCreature={creature}>
                                <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 w-23 h-16 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson">
                                    <span className="text-wrap wrap-normal text-sm/tight">
                                        Manage Breeding Pairs
                                    </span>
                                </Button>
                            </ManageBreedingPairsDialog>
                            <LogAsProgenyDialog creature={creature}>
                                <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 w-23 h-16 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson">
                                    <span className="text-wrap wrap-normal text-sm/tight">
                                        Log as Progeny
                                    </span>
                                </Button>
                            </LogAsProgenyDialog>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 w-23 h-16 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson"
                                        disabled={isDeleting || isArchiving}
                                    >
                                        <span className="text-wrap wrap-normal gap-y-1 text-sm/tight">
                                            Remove From Collection
                                        </span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Remove &#34;{creature.creatureName || creature.code}
                                            &#34;?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You can <strong>archive</strong> this creature to hide
                                            it from your main collection while preserving its data
                                            for pedigrees.
                                            {(isParentOfPair || isProgeny) && (
                                                <p className="font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                                                    Warning: This creature is part of a breeding
                                                    pair or is logged as progeny. Deleting it
                                                    permanently may break pedigree links, and if you
                                                    no longer own the creature they cannot be
                                                    restored. Inbreeding detection relies on these
                                                    links to function.
                                                </p>
                                            )}
                                            <p className="mt-2">
                                                <strong>Permanent deletion</strong> cannot be
                                                undone.
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
                                            className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson"
                                            variant="destructive"
                                            onClick={handleDeletePermanently}
                                            disabled={isArchiving || isDeleting}
                                        >
                                            <span className="flex text-red-700">
                                                {isDeleting ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                )}{' '}
                                                Delete Permanently
                                            </span>
                                        </Button>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    ) : (
                        <>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 w-23 h-16"
                                        disabled={isDeleting || isArchiving}
                                    >
                                        <span className="text-wrap wrap-normal gap-y-1 text-sm/tight">
                                            Remove from Collection
                                        </span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete this creature
                                            permanently from the database? If you still own it it
                                            will be added again on a resync if it is in one of your
                                            synced tabs.
                                            {(isParentOfPair || isProgeny) && (
                                                <p className="font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                                                    Warning: This creature is part of a breeding
                                                    pair or is logged as progeny. Deleting it
                                                    permanently may break pedigree links, and if you
                                                    no longer own the creature they cannot be
                                                    restored. Inbreeding detection relies on these
                                                    links to function.
                                                </p>
                                            )}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeletePermanently}
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
                            <Button
                                className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 w-23 h-16"
                                onClick={handleArchive}
                                disabled={isArchiving || isDeleting}
                            >
                                <span className="text-wrap wrap-normal gap-y-1 text-sm/tight">
                                    Restore From Archive
                                </span>
                            </Button>
                        </>
                    )}
                </div>
                <Link
                    href={`https://finaloutpost.net/view/${creature!.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-md font-semibold text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine text-center py-2 hover:underline"
                >
                    View on TFO
                </Link>
            </CardFooter>
        </Card>
    );
}
