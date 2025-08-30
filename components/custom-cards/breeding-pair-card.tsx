"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
    EnrichedCreature,
    EnrichedBreedingPair,
    EnrichedResearchGoal,
    DbBreedingPair,
    DbBreedingLogEntry,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
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
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SpeciesAvatar } from "@/components/misc-custom-components/species-avatar";
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
    Dna,
    ChevronDown,
} from "lucide-react";
import { EditBreedingPairDialog } from "@/components/custom-dialogs/edit-breeding-pair-dialog";
import { getHybridOffspring } from "@/lib/breeding-rules";
import { LogBreedingDialog } from "@/components/custom-dialogs/log-breeding-dialog";
import { ViewOutcomesDialog } from "../custom-dialogs/view-outcomes-dialog";

type BreedingPairCardProps = {
    pair: EnrichedBreedingPair;
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
};

const ParentGeneSummary = ({ creature }: { creature: EnrichedCreature }) => {
    if (!creature?.geneData || creature.geneData.length === 0) {
        return <p className="text-xs text-dusk-purple h-4">&nbsp;</p>; // Keep layout consistent
    }
    const summary = creature.geneData
        .filter((g) => g.category !== "Gender")
        .map(
            (gene) =>
                `<strong>${gene.category}:</strong> ${gene.phenotype} (${gene.genotype})`
        )
        .join(", ");

    return (
        <p
            className="pt-1 text-xs text-dusk-purple break-words"
            dangerouslySetInnerHTML={{ __html: summary }}
            title={summary.replace(/<strong>/g, "").replace(/<\/strong>/g, "")}
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
                    <div
                        key={gene.category}
                        className="flex justify-between items-baseline"
                    >
                        <span className="font-semibold mr-2">
                            {gene.category}:
                        </span>
                        <span className="text-right truncate">
                            {gene.phenotype}
                        </span>
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
}: BreedingPairCardProps) {
    const router = useRouter();
    const [isPinned, setIsPinned] = useState(pair!.isPinned);
    const [isPinning, setIsPinning] = useState(false);
    const [isRemovingProgeny, setIsRemovingProgeny] = useState<string | null>(
        null
    );
    if (!pair?.maleParent || !pair.femaleParent || !allPairs || !allLogs) {
        return null;
    }

    const handlePinToggle = async () => {
        setIsPinning(true);
        try {
            await fetch(`/api/breeding-pairs/${pair!.id}/pin`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPinned: !isPinned }),
            });
            setIsPinned(!isPinned);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Could not update pin status.");
        } finally {
            setIsPinning(false);
        }
    };

    const handleRemoveProgeny = async (progenyId: string) => {
        setIsRemovingProgeny(progenyId);
        try {
            const response = await fetch(
                `/api/breeding-pairs/${pair.id}?progenyId=${progenyId}`,
                {
                    method: "DELETE",
                }
            );
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to remove progeny.");
            }
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setIsRemovingProgeny(null);
        }
    };

    const getCacheBustedImageUrl = (
        creature: EnrichedCreature | null | undefined
    ) => {
        if (!creature?.imageUrl) {
            return "";
        }

        if (creature.updatedAt) {
            return `${creature.imageUrl}?v=${new Date(
                creature.updatedAt
            ).getTime()}`;
        }
        return creature.imageUrl;
    };

    const maleParent = pair!.maleParent;
    const femaleParent = pair!.femaleParent;
    const hybridSpecies = getHybridOffspring(
        maleParent!.species!,
        femaleParent!.species!
    );

    const pairForDialog = { id: pair!.id, species: pair!.species };
    return (
        <Card className="bg-ebena-lavender text-pompaca-purple overflow-hidden flex flex-col border-border drop-shadow-md drop-shadow-gray-500 h-full">
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
                        <Pin className="h-5 w-5 text-pompaca-purple fill-pompaca-purple" />
                    ) : (
                        <PinOff className="h-5 w-5 text-dusk-purple" />
                    )}
                </Button>
            </div>
            {/* Header Section */}
            <div className="relative p-4">
                {/* Title */}
                <h3
                    className="text-xl font-bold text-center truncate"
                    title={pair.pairName}
                >
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
            <CardContent className="flex flex-col items-center flex-grow gap-4 p-4 pt-0">
                {/* Parent Details */}
                <div className="px-2 text-center text-md text-pompaca-purple">
                    <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-center w-full text-left">
                            <p className="truncate">
                                <span className="font-semibold text-pompaca-purple">
                                    M:
                                </span>{" "}
                                {maleParent.creatureName || "Unnamed"} ({maleParent.code})
                            </p>
                            <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <ParentGeneSummary creature={maleParent} />
                        </CollapsibleContent>
                    </Collapsible>
                    <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-center w-full text-left">
                            <p className="truncate">
                                <span className="font-semibold text-pompaca-purple">
                                    F:
                                </span>{" "}
                                {femaleParent.creatureName || "Unnamed"} ({femaleParent.code})
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
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm">
                                Progeny ({pair.progenyCount})
                            </h4>
                            {pair.isInbred && (
                                <Tooltip delayDuration={100}>
                                    <TooltipTrigger>
                                        <Network className="h-4 w-4 text-yellow-600" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-pompaca-purple text-barely-lilac border-dusk-purple">
                                        <p>
                                            This pair is inbred. Progeny may
                                            inherit this status.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                        <ScrollArea className="flex-grow bg-ebena-lavender/50 rounded-md border p-2">
                            {pair.progeny && pair.progeny.length > 0 ? (
                                <ul className="text-xs space-y-1">
                                    {pair.progeny.map((p) => {
                                        if (!p) return null;
                                        return (
                                            <li
                                                key={p.id}
                                                className="flex items-center justify-between gap-1 p-1 rounded hover:bg-pompaca-purple/10"
                                            >
                                                <TooltipProvider>
                                                    <Tooltip
                                                        delayDuration={100}
                                                    >
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-2 cursor-default truncate">
                                                                <SpeciesAvatar
                                                                    species={
                                                                        p.species!
                                                                    }
                                                                    className="h-4 w-4"
                                                                />
                                                                <Link
                                                                    href={`https://finaloutpost.net/view/${p.code}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="truncate hover:underline wrap-anywhere"
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    {p.creatureName ||
                                                                        "Unnamed"}{" "}
                                                                    ({p.code})
                                                                </Link>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="hidden md:block bg-pompaca-purple text-barely-lilac border-dusk-purple p-2 max-w-xs w-64">
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
                                                        <DialogContent className="bg-barely-lilac">
                                                            <DialogHeader>
                                                                <DialogTitle>
                                                                    {p.creatureName ||
                                                                        "Unnamed"}{" "}
                                                                    ({p.code})
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
                                                        <AlertDialogTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 flex-shrink-0 text-red-500 hover:bg-red-100 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-barely-lilac">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Are you
                                                                    sure?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will
                                                                    remove "
                                                                    {
                                                                        p.creatureName
                                                                    }{" "}
                                                                    ({p.code})"
                                                                    from this
                                                                    pair's
                                                                    progeny log.
                                                                    This action
                                                                    cannot be
                                                                    undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        handleRemoveProgeny(
                                                                            p.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isRemovingProgeny ===
                                                                        p.id
                                                                    }
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    {isRemovingProgeny ===
                                                                    p.id ? (
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

                        <h4 className="font-bold text-sm mb-1">
                            Assigned Goals
                        </h4>
                        <ScrollArea className="flex-grow bg-ebena-lavender/50 rounded-md border p-2">
                            {pair.assignedGoals &&
                            pair.assignedGoals.length > 0 ? (
                                <ul className="text-xs space-y-1">
                                    {pair.assignedGoals.map((g) => (
                                        <li
                                            key={g.id}
                                            className="flex items-center justify-between gap-1"
                                        >
                                            <div className="flex items-center gap-1 truncate">
                                                {g.isAchieved ? (
                                                    <Award className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                                ) : (
                                                    <Target className="h-3 w-3 text-dusk-purple flex-shrink-0" />
                                                )}
                                                <Link
                                                    href={`/research-goals/${g.id}`}
                                                    className="truncate hover:underline wrap-anywhere"
                                                >
                                                    {g.name}
                                                </Link>
                                            </div>
                                            <div
                                                className={`text-right text-dusk-purple flex-shrink-0 font-semibold ${
                                                    !g.isPossible
                                                        ? "text-red-500"
                                                        : ""
                                                }`}
                                            >
                                                {g.isPossible
                                                    ? `${Math.round(
                                                          g.averageChance * 100
                                                      )}%`
                                                    : "Impossible"}
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
                <LogBreedingDialog
                    pair={pairForDialog}
                    allCreatures={allCreatures}
                >
                    <Button className="bg-emoji-eggplant text-barely-lilac h-16 w-24 text-sm/tight">
                        Log
                        <br />
                        Breeding
                    </Button>
                </LogBreedingDialog>
                <ViewOutcomesDialog pair={pair}>
                    <Button className="h-16 text-sm/tight bg-emoji-eggplant text-barely-lilac w-24">
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
                    <Button className="bg-emoji-eggplant text-barely-lilac h-16 w-24 text-sm/tight">
                        Edit /
                        <br />
                        Delete
                    </Button>
                </EditBreedingPairDialog>
            </div>
        </Card>
    );
}
