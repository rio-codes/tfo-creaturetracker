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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SpeciesAvatar } from "@/components/misc-custom-components/species-avatar";
import { Pin, PinOff, X, Target, Award, Network } from "lucide-react";
import { EditBreedingPairDialog } from "@/components/custom-dialogs/edit-breeding-pair-dialog";
import { getHybridOffspring } from "@/lib/breeding-rules";
import { LogBreedingDialog } from "@/components/custom-dialogs/log-breeding-dialog";

type BreedingPairCardProps = {
    pair: EnrichedBreedingPair;
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    allPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
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
                        src={maleParent.imageUrl}
                        alt={maleParent.code}
                        className="w-30 h-30 object-contain bg-blue-100 p-1 border-2 border-pompaca-purple rounded-lg"
                    />
                    <X className="text-dusk-purple" />
                    <img
                        src={femaleParent.imageUrl}
                        alt={femaleParent.code}
                        className="w-30 h-30 object-contain bg-pink-100 p-1 border-2 border-pompaca-purple rounded-lg"
                    />
                </div>
            </div>

            {/* Content Section */}
            <CardContent className="p-4 pt-0 flex-grow items-center flex flex-col gap-4">
                {/* Parent Details */}
                <div className="text-md text-center text-pompaca-purple">
                    <p className="truncate">
                        <span className="font-semibold text-pompaca-purple">
                            M:
                        </span>{" "}
                        {maleParent.creatureName || "Unnamed"} (
                        {maleParent.code})
                    </p>
                    <p className="truncate">
                        <span className="font-semibold text-pompaca-purple">
                            F:
                        </span>{" "}
                        {femaleParent.creatureName || "Unnamed"} (
                        {femaleParent.code})
                    </p>
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
                                        <p>This pair is inbred. Progeny may inherit this status.</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                        <ScrollArea className="flex-grow bg-ebena-lavender/50 rounded-md border p-2">
                            {pair.progeny && pair.progeny.length > 0 ? (
                                <ul className="text-xs space-y-1">
                                    {pair.progeny.map((p) => (
                                        <Tooltip key={p.id} delayDuration={100}>
                                            <TooltipTrigger asChild>
                                                <li className="flex items-center gap-2 cursor-default p-1 rounded hover:bg-pompaca-purple/10">
                                                    <SpeciesAvatar
                                                        species={p.species!}
                                                        size="sm"
                                                    />
                                                    <Link
                                                        href={`https://finaloutpost.net/view/${p.code}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="truncate hover:underline wrap-anywhere"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        {p.creatureName ||
                                                            "Unnamed"}{" "}
                                                        ({p.code})
                                                    </Link>
                                                </li>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-pompaca-purple text-barely-lilac border-dusk-purple p-2 max-w-xs w-64">
                                                <div className="flex flex-col items-center gap-2">
                                                    <img
                                                        src={p.imageUrl}
                                                        alt={p.code}
                                                        className="w-28 h-28 object-contain bg-ebena-lavender p-1 border-2 border-dusk-purple rounded-lg"
                                                    />
                                                    <div className="w-full text-xs space-y-1 mt-1 text-left">
                                                        {p.geneData?.map(
                                                            (gene) => (
                                                                <div
                                                                    key={
                                                                        gene.category
                                                                    }
                                                                    className="flex justify-between items-baseline"
                                                                >
                                                                    <span className="font-semibold mr-2">
                                                                        {
                                                                            gene.category
                                                                        }
                                                                        :
                                                                    </span>
                                                                    <span className="text-right truncate">
                                                                        {
                                                                            gene.phenotype
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
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
                                            className="flex items-center gap-1"
                                        >
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
            <div className="flex w-full gap-x-2 justify-center">
                <LogBreedingDialog
                    pair={pairForDialog}
                    allCreatures={allCreatures}
                >
                    <Button className="bg-emoji-eggplant text-barely-lilac h-16 w-25 text-sm/tight">
                        Log Breeding
                    </Button>
                </LogBreedingDialog>
                <EditBreedingPairDialog
                    pair={pair}
                    allCreatures={allCreatures}
                    allGoals={allGoals}
                    allPairs={allPairs}
                    allLogs={allLogs}
                >
                    <Button className="bg-emoji-eggplant text-barely-lilac h-16 w-25 text-sm/tight">
                        Edit / Delete
                    </Button>
                </EditBreedingPairDialog>
            </div>
        </Card>
    );
}
