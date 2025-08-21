"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ResearchGoal } from "@/types/index";
import { EditGoalDialog } from "./edit-goal-dialog";

interface ResearchGoalCardProps {
    goal: ResearchGoal;
}

export function ResearchGoalCard({ goal }: ResearchGoalCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPinned, setIsPinned] = useState(goal.isPinned);
    const [isPinning, setIsPinning] = useState(false);

    const geneEntries = goal.genes ? Object.entries(goal.genes) : [];

    const handleDelete = async () => {
        if (
            !window.confirm(
                `Are you sure you want to delete the goal "${goal.name}"? This cannot be undone.`
            )
        ) {
            return;
        }

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/research-goals/${goal.id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete the goal.");
            }
            router.refresh();
        } catch (error: any) {
            alert(error.message); // Show an alert on failure
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePinToggle = async () => {
        setIsPinning(true);
        const newPinState = !isPinned;

        try {
            const response = await fetch(`/api/research-goals/${goal.id}/pin`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPinned: newPinState }),
            });

            if (!response.ok) {
                throw new Error("Failed to update pin status.");
            }

            setIsPinned(newPinState);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Could not update pin status. Please try again.");
        } finally {
            setIsPinning(false);
        }
    };

    return (
        <Card className="bg-ebena-lavender text-pompaca-purple border-border overflow-hidden drop-shadow-md drop-shadow-gray-500">
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
                {/* Goal Image */}
                <div className="bg- rounded-lg p-4 mb-4 flex justify-center">
                    <img
                        src={goal.imageUrl || "/placeholder.png"}
                        alt={goal.name}
                        className="w-35 h-35 object-scale-down"
                    />
                </div>

                {/* Goal Details in Scrollable Area */}
                <ScrollArea className="h-32 mb-4 relative rounded-md border border-pompaca-purple/30 p-4 bg-ebena-lavender/20">
                    <div className="text-sm text-card-foreground space-y-1">
                        <div>
                            <strong>Name:</strong> {goal.name}
                        </div>
                        <div>
                            <strong>Species:</strong> {goal.species}
                        </div>
                        <div className="whitespace-pre-line pr-4">
                            <strong>Target Genes:</strong>
                            {geneEntries.length > 0 ? (
                                <div className="pl-2 text-dusk-purple text-xs font-mono mt-1">
                                    {geneEntries.map(([category, genotype]) => (
                                        <div key={category}>
                                            {category}: {genotype as string}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No specific genes targeted.</p>
                            )}
                        </div>
                    </div>

                    <ScrollBar orientation="vertical" />

                    {/* Fake Scrollbar Hint */}
                    <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple">
                        <ChevronUp className="h-4 w-4 text-barely-lilac" />
                        <ChevronDown className="h-4 w-4 text-barely-lilac" />
                    </div>
                </ScrollArea>

                {/* Action Buttons (placeholders for now) */}
                <div className="flex w-full gap-x-2 justify-center">
                    <Button
                        disabled
                        className="bg-dusk-purple text-pompaca-purple h-15 w-30"
                    >
                        <span className="text-wrap wrap-normal">
                            Goal Tracker
                        </span>
                    </Button>
                    <EditGoalDialog goal={goal}>
                        <Button
                            className="bg-dusk-purple text-pompaca-purple h-15 w-30"
                        >
                            <span className="text-wrap wrap-normal">
                                Edit or Delete Goal
                            </span>
                        </Button>
                    </EditGoalDialog>
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
