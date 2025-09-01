"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { EnrichedBreedingPair } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

type Outcome = {
    genotype: string;
    phenotype: string;
    probability: number;
};

type OutcomesByCategory = {
    [category: string]: Outcome[];
};

/**
 * A helper function to reliably compare two genotype selection objects.
 * Using JSON.stringify() is unreliable because the order of keys is not guaranteed.
 * This function checks for equality regardless of key order.
 */
function areGenotypesEqual(obj1: { [key: string]: string }, obj2: { [key: string]: string }): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) return false;
    }

    return true;
}

export function ViewOutcomesDialog({
    children,
    pair,
}: {
    children: React.ReactNode;
    pair: EnrichedBreedingPair;
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [outcomes, setOutcomes] = useState<OutcomesByCategory | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // Holds the "canonical" URL for the most-likely outcome for this dialog session. Starts null.
    const [defaultPreviewUrl, setDefaultPreviewUrl] = useState<string | null>(null);
    // Holds the currently displayed URL, which can change based on selection. Starts null.
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedGenotypes, setSelectedGenotypes] = useState<{ [key: string]: string }>({});
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [newGoalName, setNewGoalName] = useState("");
    const [isSavingGoal, setIsSavingGoal] = useState(false);

    // Helper function to fetch and set a new preview image.
    const updatePreviewImage = async (genotypes: { [key: string]: string }) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/breeding-pairs/${pair.id}/outcomes-preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedGenotypes: genotypes }),
            });
            if (response.ok) {
                const data = await response.json();
                const newUrl = `${data.imageUrl}?v=${new Date().getTime()}`;
                setPreviewUrl(newUrl);
                return newUrl; // Return for setting the default URL
            }
        } catch (error) {
            Sentry.captureException(error);
        } finally {
            setIsLoading(false);
        }
        return null;
    };

    const handleSaveAsGoal = async () => {
        if (!newGoalName.trim()) {
            // Optionally show a toast error
            return;
        }
        setIsSavingGoal(true);
        try {
            const response = await fetch('/api/research-goals/from-outcomes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pairId: pair.id,
                    goalName: newGoalName,
                    species: pair.species,
                    selectedGenotypes: selectedGenotypes,
                }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save goal.');
            }
            router.refresh();
            setIsOpen(false); // Close the main outcomes dialog
        } catch (error: any) {
            Sentry.captureException(error);
            alert(error.message); // Replace with a toast notification for better UX
        } finally {
            setIsSavingGoal(false);
            setShowSaveDialog(false);
        }
    };

    const mostLikelyGenotypes = useMemo(() => {
        if (!outcomes) return {};
        const result: { [key: string]: string } = {};
        for (const category in outcomes) {
            result[category] = outcomes[category][0].genotype;
        }
        return result;
    }, [outcomes]);

    useEffect(() => {
        // Reset state when dialog is closed to ensure fresh data on reopen
        if (!isOpen) {
            setOutcomes(null); // This will trigger a re-fetch on next open
            return;
        }

        // This effect runs once when the dialog opens to fetch all necessary data.
        if (!outcomes) {
            const fetchInitialData = async () => {
                setIsLoading(true);
                try {
                    const outcomesResponse = await fetch(`/api/breeding-pairs/${pair.id}/outcomes`);
                    if (!outcomesResponse.ok) throw new Error("Failed to fetch outcomes.");
                    
                    const data = await outcomesResponse.json();
                    setOutcomes(data.outcomes);

                    const initialSelections: { [key: string]: string } = {};
                    for (const category in data.outcomes) {
                        initialSelections[category] = data.outcomes[category][0].genotype;
                    }
                    setSelectedGenotypes(initialSelections);

                    // Fetch the initial preview for the most likely outcomes
                    const initialUrl = await updatePreviewImage(initialSelections);
                    if (initialUrl) {
                        setDefaultPreviewUrl(initialUrl);
                    }
                } catch (error) {
                    Sentry.captureException(error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInitialData();
        }
    }, [isOpen, pair.id, outcomes]);

    useEffect(() => {
        // Don't run if genotypes aren't set yet
        if (Object.keys(selectedGenotypes).length === 0) {
            return;
        }

        // If selection is the most likely, just use the default URL
        if (areGenotypesEqual(selectedGenotypes, mostLikelyGenotypes)) {
            setPreviewUrl(defaultPreviewUrl);
            return;
        };

        // This is the logic that runs every time a select box is changed.
        const handler = setTimeout(async () => {
            updatePreviewImage(selectedGenotypes);
        }, 500);

        return () => clearTimeout(handler);
    }, [selectedGenotypes]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-barely-lilac dark:bg-slate-900 max-w-screen-lg w-2/3 max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Possible Outcomes for {pair.pairName}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                    <ScrollArea className="h-full rounded-md border bg-ebena-lavender/50 dark:bg-slate-800/50 p-4">
                        <div className="space-y-4">
                            {isLoading && !outcomes ? <Loader2 className="animate-spin" /> : null}
                            {outcomes && Object.entries(outcomes).map(([category, categoryOutcomes]) => (
                                <div key={category} className="space-y-1">
                                    <Label className="font-bold text-pompaca-purple dark:text-purple-300 text-xs">{category}</Label>
                                    <Select
                                        value={selectedGenotypes[category]}
                                        onValueChange={(value) => setSelectedGenotypes(prev => ({ ...prev, [category]: value }))}
                                    >
                                        <SelectTrigger className="w-47 bg-ebena-lavender dark:bg-slate-800 px-1 text-xs">
                                            <SelectValue placeholder={`Select ${category}...`} />
                                        </SelectTrigger>
                                        <SelectContent className="w-55 bg-ebena-lavender dark:bg-slate-800 text-xs">
                                            {categoryOutcomes.map(o => (
                                                <SelectItem key={o.genotype} value={o.genotype} className="w-55 text-xs">
                                                    {o.phenotype} ({o.genotype}) - <span className="font-semibold">{Math.round(o.probability * 100)}%</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                    <div className="border rounded-md flex items-center justify-center bg-ebena-lavender/50 dark:bg-slate-800/50 relative">
                        {isLoading && <Loader2 className="animate-spin absolute" />}
                        {previewUrl && <img 
                            key={previewUrl} // Force re-render on URL change
                            src={previewUrl} 
                            alt="Progeny Preview" 
                            className="max-w-full max-h-full object-contain"
                            onError={() => setPreviewUrl(null)} // Handle broken image links
                        />}
                        {!previewUrl && !isLoading && <p>No preview available.</p>}
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={() => setShowSaveDialog(true)} disabled={!outcomes || isLoading} className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950">
                        Save as Goal
                    </Button>
                </div>
                <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} >
                    <AlertDialogContent className="bg-barely-lilac">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Save as New Research Goal</AlertDialogTitle>
                            <AlertDialogDescription>
                                Enter a name for this new goal. It will be created with the currently selected genes and assigned to this breeding pair.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-2">
                            <Label htmlFor="goal-name" className="text-pompaca-purple">Goal Name</Label>
                            <Input 
                                id="goal-name" 
                                value={newGoalName} 
                                onChange={(e) => setNewGoalName(e.target.value)}
                                placeholder="e.g., Perfect Cielarka"
                                className="bg-ebena-lavender dark:bg-slate-800 mt-1"
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSaveAsGoal} disabled={isSavingGoal || !newGoalName.trim()} className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950">
                                {isSavingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Goal"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    );
}
