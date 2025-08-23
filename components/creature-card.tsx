"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronUp,
    ChevronDown,
    Pin,
    PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { BreedingPairWithDetails, Creature } from "@/types/index";
import { ManageBreedingPairsDialog } from "./manage-breeding-pairs-dialog";

interface CreatureCardProps {
    creature: Creature;
    allCreatures: Creature[];
    allPairs: BreedingPairWithDetails[];
}

export function CreatureCard({
    creature,
    allCreatures,
    allPairs,
}: CreatureCardProps) {
    const router = useRouter();
    const [isPinned, setIsPinned] = useState(creature.isPinned);
    const [isPinning, setIsPinning] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePinToggle = async () => {
        setIsPinning(true);
        const newPinState = !isPinned;
        try {
            const response = await fetch(`/api/creatures/${creature.id}/pin`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPinned: newPinState }),
            });
            if (!response.ok) {
                throw new Error("Failed to update pin status.");
            }
            setIsPinned(newPinState);
            router.refresh(); // Re-fetch data to re-sort the grid
        } catch (error) {
            console.error(error);
            alert("Could not update pin status. Please try again.");
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
            const response = await fetch(`/api/creatures/${creature.id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to remove the creature.");
            }
            router.refresh();
        } catch (error: any) {
            alert(error.message); // Show an alert on failure
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card className="bg-ebena-lavender text-pompaca-purple border-border overflow-hidden overscroll-y-contain drop-shadow-md drop-shadow-gray-500">
            <div className="absolute top-1 right-1 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePinToggle}
                    disabled={isPinning}
                    aria-label={isPinned ? "Unpin goal" : "Pin goal"}
                    className="h-8 w-8 rounded-full hover:bg-pompaca-purple/20"
                >
                    {isPinned ? (
                        <Pin className="h-5 w-5 text-pompaca-purple fill-pompaca-purple" />
                    ) : (
                        <PinOff className="h-5 w-5 text-dusk-purple" />
                    )}
                </Button>
            </div>
            <CardContent className="p-4">
                {/* Creature Image */}
                <div className="rounded-lg p-4 mb-4 flex justify-center">
                    <img
                        src={creature.imageUrl || "/placeholder.png"}
                        alt={creature.code + ", " + creature.species}
                        className="w-35 h-35 object-scale-down"
                    />
                </div>
                <div className="text-smspace-y-1 ">
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
                </div>
                <div>
                    <strong>Genotype:</strong>
                </div>
                <ScrollArea className="h-32 mb-4 relative rounded-md border border-pompaca-purple/30 p-4 bg-ebena-lavender/20">
                    <div className="text-sm text-card-foreground space-y-1 ">
                        <div className="whitespace-pre-line pr-4">
                            {creature.genetics?.replaceAll(",", "\n")}
                        </div>
                    </div>
                    <ScrollBar orientation="vertical" />
                    <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple">
                        <ChevronUp className=" h-4 w-4 text-barely-lilac" />
                        <ChevronDown className="h-4 w-4 text-barely-lilac" />
                    </div>
                </ScrollArea>

                {/* Buttons */}
                <div className="flex w-full gap-2 justify-center text-sm">
                    <ManageBreedingPairsDialog
                        baseCreature={creature}
                        allCreatures={allCreatures}
                        allPairs={allPairs}
                    >
                        <Button className="bg-emoji-eggplant hover:bg-dusk-purple text-barely-lilac w-30 h-15">
                            <span className="text-wrap wrap-normal">
                                Manage Breeding Pairs
                            </span>
                        </Button>
                    </ManageBreedingPairsDialog>
                    <Button
                        onClick={handleRemoveFromCollection}
                        className="bg-emoji-eggplant hover:bg-dusk-purple text-barely-lilac w-30 h-15"
                    >
                        {isDeleting ? (
                            <span className="text-wrap wrap-normal gap-y-1">
                                "Removing..."
                            </span>
                        ) : (
                            <span className="text-wrap wrap-normal gap-y-1">
                                Remove from Collection
                            </span>
                        )}
                    </Button>
                </div>
                <div className="flex w-full justify-center">
                    <span className="text-s text-dusk-purple text-center py-5">
                        Note: Some features are still under development and not
                        yet available.
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
