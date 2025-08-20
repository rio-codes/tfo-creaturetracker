"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ResearchGoal } from "@/types/index";

interface ResearchGoalCardProps {
    goal: ResearchGoal;
}

export function ResearchGoalCard({ goal }: ResearchGoalCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

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

    return (
        <Card className="bg-ebena-lavender text-pompaca-purple border-border overflow-hidden drop-shadow-md drop-shadow-gray-500">
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
                        className="bg-dusk-purple text-pompaca-purple h-15 w-25"
                    >
                        <span className="text-wrap wrap-normal">
                            Goal Tracker
                        </span>
                    </Button>
                    <Button
                        disabled
                        className="bg-dusk-purple text-pompaca-purple h-15 w-25"
                    >
                        <span className="text-wrap wrap-normal">
                            Edit Goal Genotype
                        </span>
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-dusk-purple text-pompaca-purple h-15 w-25"
                    >
                        {isDeleting ? (
                            "Deleting..."
                        ) : (
                            <>
                                <span>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                </span>
                                <span className="text-wrap wrap-normal">
                                    Delete Goal
                                </span>
                            </>
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
