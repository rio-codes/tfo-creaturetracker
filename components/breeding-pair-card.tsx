"use client";

import type { Creature, ResearchGoal, BreedingPairWithDetails } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpeciesAvatar } from "@/components/species-avatar";
import { X } from "lucide-react"
import { EditBreedingPairDialog } from "@/components/edit-breeding-pair-dialog"

type BreedingPairCardProps = {
    pair: BreedingPairWithDetails;
    allCreatures: Creature[];
    allGoals: ResearchGoal[];
};

export function BreedingPairCard({ pair, allCreatures, allGoals }: BreedingPairCardProps) {
    // Placeholder data for stats
    const timesBred = 0; // You'll fetch this from breedingLogEntries later
    const progenyCount = 0; // You'll also fetch this

    return (
        <Card className="bg-ebena-lavender text-pompaca-purple border-border overflow-hidden overscroll-y-contain drop-shadow-md drop-shadow-gray-500 h-full">
            <div className="absolute top-3 left-3 z-10">
                <div className="relative flex-shrink-0 w-15 h-15 flex items-center justify-center bg-pompaca-purple/60 rounded-full border-2 border-pompaca-purple">
                    <SpeciesAvatar species={pair.species} />
                </div>
            </div>
            <CardContent className="flex-col p-4 px-10 h-full justify-items-center content-between">
                {/* Parent Images */}
                <div className="flex items-center p-4 mb-4">
                    <img
                        src={pair.maleParent.imageUrl}
                        alt={
                            pair.maleParent.creatureName == "Unnamed"
                                ? pair.maleParent.code
                                : pair.maleParent.creatureName
                        }
                        className="w-30 h-30 object-contain px-5 bg-blue-100 p-1 border-2 border-pompaca-purple rounded-2xl"
                    />
                    <X />
                    <img
                        src={pair.femaleParent.imageUrl}
                        alt={
                            pair.femaleParent.creatureName == "Unnamed"
                                ? pair.femaleParent.code
                                : pair.femaleParent.creatureName
                        }
                        className="w-30 h-30 object-contain px-5 bg-pink-100 p-1 border-2 border-pompaca-purple rounded-2xl"
                    />
                </div>

                {/* Pair Details */}
                <div className="w-full mb-4 align-middle relative">
                    <h3 className="text-2xl font-bold mb-3">{pair.pairName}</h3>
                    {/* Parent Details */}
                    <div>
                        <strong>Male:</strong>{" "}
                        {pair.maleParent.creatureName || "Unnamed"} (
                        {pair.maleParent.code})<br></br>
                        <strong>Female:</strong>{" "}
                        {pair.femaleParent.creatureName || "Unnamed"} (
                        {pair.femaleParent.code})
                    </div>

                    <div className="h-40">
                        {/* Breeding Stats */}
                        <div className="mb-2">
                            <strong>Times Bred:</strong> {timesBred}
                            <br></br>
                            <strong>Total Progeny:</strong> {progenyCount}
                        </div>
                        {/* Goals Section */}
                        <div>
                            {/* Goal Met? */}
                            <div className="text-red-500">
                                <strong>Goal not met</strong>
                            </div>
                            {/*Assigned Goals */}
                            <div>
                                <h4 className="font-bold text-sm">
                                    Assigned Goals:
                                </h4>
                                <ul className="list-disc list-inside text-xs py-2 text-pompaca-purple space-y-1 mt-1">
                                    {pair.assignedGoals.length > 0 ? (
                                        pair.assignedGoals.map((goal) => (
                                            <div>
                                                <span className="font-bold underline">
                                                    {goal.name}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <li>No goals assigned.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/*Buttons*/}
                <div className="object-bottom h-20">
                    <div className="flex w-full gap-2 justify-center text-md">
                        <Button
                            disabled
                            className="bg-emoji-eggplant hover:bg-dusk-purple text-barely-lilac w-42 h-15 "
                        >
                            Log Breeding Event
                        </Button>
                        <EditBreedingPairDialog pair={pair} allCreatures={allCreatures} allGoals={allGoals}>
                          <Button
                            className="bg-emoji-eggplant hover:bg-dusk-purple text-barely-lilac w-42 h-15">
                            Edit or Delete Goal
                        </Button>
                        </EditBreedingPairDialog>
                    </div>
                    <div className="flex w-full justify-center">
                        <span className="text-xs text-dusk-purple text-center">
                            Note: Some features are still under development and
                            not yet available.
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
