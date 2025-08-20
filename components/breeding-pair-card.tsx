"use client";

import type { Creature, ResearchGoal, BreedingPairWithDetails } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpeciesAvatar } from "@/components/species-avatar";

type BreedingPairCardProps = {
    pair: BreedingPairWithDetails;
};

export function BreedingPairCard({ pair }: BreedingPairCardProps) {
    // Placeholder data for stats
    const timesBred = 0; // You'll fetch this from breedingLogEntries later
    const progenyCount = 0; // You'll also fetch this

    return (
        <Card className="w-full bg-ebena-lavender text-pompaca-purple border-border overflow-hidden">
            <CardContent className="p-4 flex items-center gap-6">
                {/* Section 1: Left-Side Avatar */}
                <div className="relative flex-shrink-0 w-15 h-15 flex items-center justify-center bg-pompaca-purple/60 rounded-full border-2 border-pompaca-purple">
                    <SpeciesAvatar species={pair.species} />
                </div>

                {/* Section 2: Center Statistics Block */}
                <div className="flex-grow space-y-3">
                    <h3 className="text-2xl font-bold">{pair.pairName}</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {/* Parent Details */}
                        <div>
                            <strong>Male:</strong>{" "}
                            {pair.maleParent.creatureName || "Unnamed"} (
                            {pair.maleParent.code})
                        </div>
                        <div>
                            <strong>Female:</strong>{" "}
                            {pair.femaleParent.creatureName || "Unnamed"} (
                            {pair.femaleParent.code})
                        </div>
                        {/* Breeding Stats */}
                        <div>
                            <strong>Times Bred:</strong> {timesBred}
                        </div>
                        <div>
                            <strong>Total Progeny:</strong> {progenyCount}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Assigned Goals:</h4>
                        <ul className="list-disc list-inside text-xs py-2 text-pompaca-purple space-y-1 mt-1">
                            {pair.assignedGoals.length > 0 ? (
                                pair.assignedGoals.map((goal) => (
                                    <li key={goal.name}>
                                        <span className="font-bold">
                                            {goal.name}
                                        </span>
                                        <ul className="py-2">
                                            <li>
                                                <p className="ml-2 text-pompaca-purple ">
                                                    [Goal in 1 Gen: Not
                                                    Possible]
                                                </p>
                                            </li>
                                            <li>
                                                <p className="ml-2 text-pompaca-purple ">
                                                    [Average Hybrid Accuracy
                                                    54.5%]
                                                </p>
                                            </li>
                                            <li>
                                                <p className="ml-2 px-2 py-0.5 rounded-full bg-dusk-purple text-pompaca-purple text-xs w-fit">
                                                    [Goal Not Met]
                                                </p>
                                            </li>
                                        </ul>
                                    </li>
                                ))
                            ) : (
                                <li>No goals assigned.</li>
                            )}
                        </ul>
                    </div>
                </div>
                <div className="flex gap-2">
                    <img
                        src={pair.maleParent.imageUrl}
                        alt={
                            pair.maleParent.creatureName == "Unnamed"
                                ? pair.maleParent.code
                                : pair.maleParent.creatureName
                        }
                        className="w-30 h-30 object-contain bg-blue-100 p-1 border-2 border-pompaca-purple rounded-2xl"
                    />
                    <img
                        src={pair.femaleParent.imageUrl}
                        alt={
                            pair.femaleParent.creatureName == "Unnamed"
                                ? pair.femaleParent.code
                                : pair.femaleParent.creatureName
                        }
                        className="w-30 h-30 object-contain bg-pink-100 p-1 border-2 border-pompaca-purple rounded-2xl"
                    />
                </div>

                {/* Section 3: Buttons */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <Button
                        disabled
                        className="w-full py-4 bg-emoji-eggplant hover:bg-dusk-purple text-barely-lilac"
                    >
                        Log Breeding
                    </Button>
                    <Button
                        disabled
                        className="w-full py-4 bg-emoji-eggplant hover:bg-dusk-purple text-barely-lilac"
                    >
                        Edit Goal
                    </Button>
                    <span className="text-xs text-dusk-purple text-center w-40">
                        Note: Some features are still under development and not
                        yet available.
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
