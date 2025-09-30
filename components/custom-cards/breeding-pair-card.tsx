'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
    EnrichedCreature,
    EnrichedBreedingPair,
    EnrichedResearchGoal,
    DbBreedingPair,
    DbBreedingLogEntry,
} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SpeciesAvatar } from '@/components/misc-custom-components/species-avatar';
import {
    Pin,
    PinOff,
    X,
    Target,
    Award,
    Network,
    Trash2,
    Loader2,
    Info,
    BookText,
    ChevronDown,
} from 'lucide-react';
import { EditBreedingPairDialog } from '@/components/custom-dialogs/edit-breeding-pair-dialog';
import { LogBreedingDialog } from '@/components/custom-dialogs/log-breeding-dialog';
import { ViewOutcomesDialog } from '../custom-dialogs/view-outcomes-dialog';
import { InfoDisplay } from '../misc-custom-components/info-display';
import { ViewLogsDialog } from '../custom-dialogs/view-logs-dialog';
import { sanitizeHtml } from '@/lib/sanitize';

type BreedingPairCardProps = {
    pair: EnrichedBreedingPair;
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
    _isAdminView?: boolean;
};

const ParentGeneSummary = async ({ creature }: { creature: EnrichedCreature }) => {
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

const ProgenyPreview = ({
    creature,
    getCacheBustedImageUrl,
}: {
    creature: EnrichedCreature;
    getCacheBustedImageUrl: (c: EnrichedCreature) => string;
}) => {
    if (!creature) return null;
    return (
        <div className="flex flex-col items-center gap-2">
            <img
                src={getCacheBustedImageUrl(creature)}
                alt={creature.code}
                className="w-28 h-28 object-contain bg-ebena-lavender p-1 border-2 border-dusk-purple rounded-lg"
            />
            <div className="w-full text-xs space-y-1 mt-1 text-left">
                {creature.geneData?.map((gene) => (
                    <div key={gene.category} className="flex justify-between items-baseline">
                        <span className="font-semibold mr-2">{gene.category}:</span>
                        <span className="text-right truncate">{gene.phenotype}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export function BreedingPairCard({
    pair,
    allCreatures,
    allGoals,
    allPairs,
    allLogs,
    _isAdminView = false,
}: BreedingPairCardProps) {
    const router = useRouter();
    const [isPinned, setIsPinned] = useState(pair!.isPinned);
    const [isPinning, setIsPinning] = useState(false);
    const [isRemovingProgeny, setIsRemovingProgeny] = useState<string | null>(null);
    if (!pair?.maleParent || !pair.femaleParent || !allPairs || !allLogs) {
        return null;
    }

    const handlePinToggle = async () => {
        setIsPinning(true);
        try {
            await fetch(`/api/breeding-pairs/${pair!.id}/pin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: !isPinned }),
            });
            setIsPinned(!isPinned);
            router.push('/breeding-pairs');
        } catch (error) {
            console.error(error);
            alert('Could not update pin status.');
        } finally {
            setIsPinning(false);
        }
    };

    const handleRemoveProgeny = async (progenyId: string) => {
        setIsRemovingProgeny(progenyId);
        try {
            const response = await fetch(`/api/breeding-pairs/${pair.id}?progenyId=${progenyId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to remove progeny.');
            }
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setIsRemovingProgeny(null);
        }
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

    const maleParent = pair!.maleParent;
    const femaleParent = pair!.femaleParent;

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 overflow-hidden flex flex-col border-border drop-shadow-md drop-shadow-gray-500 h-full">
            {/*Notes Icon */}
            <div className="absolute top-2 left-2 z-10">
                <ViewLogsDialog pair={pair} allCreatures={allCreatures} allLogs={allLogs}>
                    <Button
                        size="icon"
                        className="h-6 w-20 text-dusk-purple dark:text-purple-300  hover:bg-pompaca-purple/10"
                    >
                        <BookText className="h-4 w-4" />
                        <span className="text-xs">Logs</span>
                    </Button>
                </ViewLogsDialog>
            </div>
            {/* Pin Icon */}
            <div className="absolute top-1 right-1 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePinToggle}
                    disabled={isPinning}
                    className="h-8 w-8 rounded-full hover:bg-pompaca-purple/20"
                >
                    {isPinned ? (
                        <Pin className="h-5 w-5 text-pompaca-purple dark:text-purple-300 fill-pompaca-purple dark:fill-purple-300" />
                    ) : (
                        <PinOff className="h-5 w-5 text-dusk-purple dark:text-purple-400" />
                    )}
                </Button>
            </div>
            {/* Header Section */}
            <div className="relative p-4">
                {/* Title */}
                <h3 className="text-xl font-bold text-center" title={pair.pairName}>
                    {pair.pairName}
                </h3>
                {/* Parent Images */}
                <div className="flex justify-center items-center gap-2 mt-2">
                    <img
                        src={getCacheBustedImageUrl(maleParent)}
                        alt={maleParent.code}
                        className="w-30 h-30 object-contain bg-blue-100 p-1 border-2 border-pompaca-purple rounded-lg"
                    />
                    <X className="text-dusk-purple" />
                    <img
                        src={getCacheBustedImageUrl(femaleParent)}
                        alt={femaleParent.code}
                        className="w-30 h-30 object-contain bg-pink-100 p-1 border-2 border-pompaca-purple rounded-lg"
                    />
                </div>
            </div>

            {/* Content Section */}
            <CardContent className="flex flex-col items-center flex-grow gap-4 p-4 pt-0 text-pompaca-purple dark:text-purple-300">
                {/* Parent Details */}
                <div className="px-2 text-center text-md text-pompaca-purple dark:text-purple-300">
                    <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-center">
                            <p className="text-ellipsis">
                                <span className="font-semibold text-pompaca-purple dark:text-purple-300">
                                    M:
                                </span>{' '}
                                {maleParent.creatureName || 'Unnamed'} ({maleParent.code}) (G
                                {maleParent.generation})
                            </p>
                            <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <ParentGeneSummary creature={maleParent} />
                        </CollapsibleContent>
                    </Collapsible>
                    <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-center">
                            <p className="text-ellipsis">
                                <span className="font-semibold text-pompaca-purple dark:text-purple-300">
                                    F:
                                </span>{' '}
                                {femaleParent.creatureName || 'Unnamed'} ({femaleParent.code}) (G
                                {femaleParent.generation})
                            </p>
                            <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <ParentGeneSummary creature={femaleParent} />
                        </CollapsibleContent>
                    </Collapsible>
                </div>
                <div className="text-center text-sm text-pompaca-purple">
                    Bred {pair.timesBred} times
                </div>
                {/* Main Info Grid */}
                <div className="gap-4 w-4/5">
                    {/* Left Column: Progeny */}
                    <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm">Progeny ({pair.progenyCount})</h4>
                                {pair.isInbred && (
                                    <InfoDisplay
                                        trigger={<Network className="h-4 w-4 text-yellow-600" />}
                                        content={
                                            <p className="dark:text-barely-lilac">
                                                This pair is related genetically. Offspring will be
                                                inbred.
                                            </p>
                                        }
                                    />
                                )}
                            </div>
                        </div>
                        <ScrollArea className="flex-grow bg-ebena-lavender/50 dark:bg-midnight-purple/50 rounded-md border p-2">
                            {pair.progeny && pair.progeny.length > 0 ? (
                                <ul className="text-xs space-y-1">
                                    {pair.progeny.map((p) => {
                                        if (!p) return null;
                                        return (
                                            <li
                                                key={p.id}
                                                className="flex items-center justify-between gap-1 p-1 rounded hover:bg-pompaca-purple/10"
                                            >
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip delayDuration={100}>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-2 cursor-default ">
                                                                <SpeciesAvatar
                                                                    species={p.species!}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Link
                                                                    href={`https://finaloutpost.net/view/${p.code}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-ellipsis hover:underline"
                                                                    onClick={(e) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    {p.creatureName || 'Unnamed'} (
                                                                    {p.code})
                                                                </Link>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="hidden md:block bg-pompaca-purple dark:bg-purple-400 dark:text-slate-950 text-barely-lilac border-dusk-purple p-2 max-w-xs w-64">
                                                            <ProgenyPreview
                                                                creature={p}
                                                                getCacheBustedImageUrl={
                                                                    getCacheBustedImageUrl
                                                                }
                                                            />
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <div className="flex items-center flex-shrink-0">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="md:hidden h-6 w-6 text-dusk-purple hover:bg-pompaca-purple/10"
                                                            >
                                                                <Info className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent
                                                            onPointerDownOutside={(e) =>
                                                                e.preventDefault()
                                                            }
                                                            className="bg-barely-lilac dark:bg-pompaca-purple"
                                                        >
                                                            <DialogHeader>
                                                                <DialogTitle className="text-ellipsis">
                                                                    {p.creatureName || 'Unnamed'} (
                                                                    {p.code})
                                                                </DialogTitle>
                                                            </DialogHeader>
                                                            <ProgenyPreview
                                                                creature={p}
                                                                getCacheBustedImageUrl={
                                                                    getCacheBustedImageUrl
                                                                }
                                                            />
                                                        </DialogContent>
                                                    </Dialog>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 flex-shrink-0 text-red-500 hover:bg-red-100 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-barely-lilac dark:bg-pompaca-purple">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Are you sure?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will remove &#34;
                                                                    {p.creatureName} ({p.code}
                                                                    )&#34; from this pair&#39;s
                                                                    progeny log. This action cannot
                                                                    be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        handleRemoveProgeny(p.id)
                                                                    }
                                                                    disabled={
                                                                        isRemovingProgeny === p.id
                                                                    }
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    {isRemovingProgeny === p.id ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : null}
                                                                    Remove
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-xs text-dusk-purple italic">
                                    No progeny logged.
                                </p>
                            )}
                        </ScrollArea>

                        <h4 className="font-bold text-sm mb-1">Assigned Goals</h4>
                        <ScrollArea className="flex-grow bg-ebena-lavender/50 dark:bg-midnight-purple/50 rounded-md border p-2">
                            {pair.assignedGoals && pair.assignedGoals.length > 0 ? (
                                <ul className="text-xs space-y-1">
                                    {pair.assignedGoals.map((g) => (
                                        <li
                                            key={g.id}
                                            className="flex items-center justify-between gap-1"
                                        >
                                            <div className="flex items-center gap-1 text-ellipsis">
                                                {g.isAchieved ? (
                                                    <Award className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                                ) : (
                                                    <Target className="h-3 w-3 text-dusk-purple flex-shrink-0" />
                                                )}
                                                <Link
                                                    title={g.name}
                                                    href={`/research-goals/${g.id}`}
                                                    className="text-ellipsis hover:underline"
                                                >
                                                    {g.name}
                                                </Link>
                                            </div>
                                            <div
                                                className={`text-right text-dusk-purple flex-shrink-0 font-semibold ${
                                                    !g.isPossible ? 'text-red-500' : ''
                                                }`}
                                            >
                                                {g.isPossible
                                                    ? `${(g.averageChance * 100).toFixed(2)}%`
                                                    : 'Impossible'}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-dusk-purple italic">
                                    No goals assigned.
                                </p>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </CardContent>

            {/* Footer Buttons */}
            <div className="flex w-full gap-x-1 justify-center p-2">
                <LogBreedingDialog pair={pair} allCreatures={allCreatures}>
                    <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-13 w-18 md:w-30 text-xs/tight">
                        Log
                        <br />
                        Breeding
                    </Button>
                </LogBreedingDialog>
                <ViewOutcomesDialog pair={pair}>
                    <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-13 w-18 md:w-30 text-xs/tight">
                        Possible
                        <br />
                        Outcomes
                    </Button>
                </ViewOutcomesDialog>
                <EditBreedingPairDialog
                    pair={pair}
                    allCreatures={allCreatures}
                    allGoals={allGoals}
                    allPairs={allPairs}
                    allLogs={allLogs}
                >
                    <Button className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950 h-13 w-18 md:w-30 text-xs/tight">
                        Edit /
                        <br />
                        Delete
                    </Button>
                </EditBreedingPairDialog>
            </div>
        </Card>
    );
}
