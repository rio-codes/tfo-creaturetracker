"use client";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Creature } from "@/types/index";
import { AddBreedingPairDialog } from "@/components/add-pair-dialog";

interface CreatureCardProps {
    creature: Creature;
    allCreaturesData: Creature[];
}

export function CreatureCard({
    creature,
    allCreaturesData,
}: CreatureCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCreature, setSelectedCreature] = useState(null);

    const handleOpenDialog = (creature) => {
        setSelectedCreature(creature);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedCreature(null);
    };

    return (
        <Card className="bg-ebena-lavender text-pompaca-purple border-border overflow-hidden overscroll-y-contain drop-shadow-md drop-shadow-gray-500">
            <CardContent className="p-4">
                {/* Creature Image */}
                <div className="bg- rounded-lg p-4 mb-4 flex justify-center">
                    <img
                        src={creature.imageUrl || "/placeholder.png"}
                        alt={creature.code + ", " + creature.species}
                        className="w-35 h-35 object-scale-down"
                    />
                </div>

                <ScrollArea className="h-32 mb-4 relative rounded-md border border-pompaca-purple/30 p-4 bg-ebena-lavender/20">
                    <div className="text-sm text-card-foreground space-y-1 ">
                        <div>
                            <strong>Name:</strong> {creature.creatureName}
                        </div>
                        <div>
                            <strong>Code:</strong> {creature.code}
                        </div>
                        <div>
                            <strong>Gender:</strong> {creature.gender}
                        </div>
                        <div className="whitespace-pre-line pr-4">
                            <strong>Genotype:</strong>{" "}
                            {creature.genetics?.replaceAll(",", "\n")}
                        </div>
                    </div>
                    <ScrollBar orientation="vertical" />
                    <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple">
                        <ChevronUp className=" h-4 w-4 text-barely-lilac" />
                        <ChevronDown className="h-4 w-4 text-barely-lilac" />
                    </div>
                </ScrollArea>

                {/* Action Buttons (placeholders for now) */}
                <div className="flex w-full gap-2 justify-center">
                    <Button
                        disabled
                        onClick={() => handleOpenDialog(creature)}
                        className="bg-dusk-purple text-pompaca-purple"
                    >
                        <AddBreedingPairDialog
                            isOpen={isDialogOpen}
                            onClose={handleCloseDialog}
                            baseCreature={selectedCreature}
                            allCreatures={allCreaturesData}
                        />
                        Add to Breeding Pair
                    </Button>
                    <Button
                        disabled
                        className="bg-dusk-purple text-pompaca-purple"
                    >
                        Remove from Collection
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
