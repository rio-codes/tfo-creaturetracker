"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EnrichedResearchGoal } from "@/types";
import { Loader2 } from "lucide-react";
import { structuredGeneData } from "@/lib/creature-data";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

type AmbiguousCategory = {
    category: string;
    phenotype: string;
    options: { genotype: string; phenotype: string }[] | undefined;
};

type GeneInfo = {
    genotype: string;
    phenotype: string;
    isMultiGenotype: boolean;
};

type GoalModeSwitcherProps = {
    goal: EnrichedResearchGoal;
};

// This is the corrected function signature. It takes props and returns JSX.
export function GoalModeSwitcher({ goal }: GoalModeSwitcherProps) {
    const router = useRouter();
    const [isSwitchingMode, setIsSwitchingMode] = useState(false);
    const [error, setError] = useState("");

    // State for the two separate dialogs
    const [isConversionDialogOpen, setIsConversionDialogOpen] = useState(false);
    const [ambiguousCategories, setAmbiguousCategories] = useState<
        AmbiguousCategory[]
    >([]);
    const [conversionSelections, setConversionSelections] = useState<{
        [key: string]: string;
    }>({});

    const newMode = goal?.goalMode === "genotype" ? "phenotype" : "genotype";

    const handleModeSwitch = async () => {
        // check for ambiguity if switching to genotype mode
        if (goal?.goalMode === "phenotype") {
            const ambiguous: AmbiguousCategory[] = [];
            const speciesData = structuredGeneData[goal.species];
            // create array of ambiguous genes
            for (const [category, geneInfo] of Object.entries(goal.genes)) {
                if ((geneInfo as GeneInfo).isMultiGenotype) {
                    const options = speciesData?.[category]?.filter(
                        (g) => g.phenotype === (geneInfo as GeneInfo).phenotype
                    );
                    ambiguous.push({
                        category,
                        phenotype: (geneInfo as GeneInfo).phenotype,
                        options,
                    });
                }
            }
            // if ambiguous categories were found, set state and open dialog
            if (ambiguous.length > 0) {
                setAmbiguousCategories(ambiguous);
                setIsConversionDialogOpen(true);
                return;
            }
        }

        // if no ambiguity, proceed with the simple toggle
        setIsSwitchingMode(true);
        setError("");
        try {
            const response = await fetch(
                `/api/research-goals/${goal?.id}/toggle-mode`,
                { method: "PATCH" }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSwitchingMode(false);
        }
    };

    // submitting conversion data
    const handleConversionSubmit = async () => {
        setIsSwitchingMode(true);
        setError("");
        try {
            const response = await fetch(
                `/api/research-goals/${goal?.id}/convert-to-genotype`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ conversions: conversionSelections }),
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setIsConversionDialogOpen(false);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSwitchingMode(false);
        }
    };

    return (
        <TooltipProvider>
            {/* Confirmation Dialog */}
            <AlertDialog>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                            <Badge
                                className={
                                    goal?.goalMode === "genotype"
                                        ? "h-auto p-2 text-pompaca-purple capitalize text-center text-sm drop-shadow-md bg-dna-magenta/60 rounded-md border-2 border-pompaca-purple w-fit mb-5"
                                        : "h-auto p-2 text-pompaca-purple capitalize text-center text-sm drop-shadow-md bg-dna-teal/60 rounded-md border-2 border-pompaca-purple w-fit mb-5"
                                }
                            >
                                <span>
                                    {goal?.goalMode === "genotype"
                                        ? "🧬 Genotype Mode"
                                        : "🪶 Phenotype Mode"}
                                </span>
                            </Badge>
                        </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="bg-barely-lilac/80 text-pompaca-purple">
                        <div className="max-w-xs p-2">
                            <h4 className="font-bold mb-1">
                                {goal?.goalMode === "genotype"
                                    ? "Genotype Mode"
                                    : "Phenotype Mode"}
                            </h4>
                            {goal?.goalMode === "genotype" ? (
                                <p>
                                    <b>Click to switch mode</b> Genotype mode
                                    calculates odds for achieving an exact
                                    genetic code. Match scores will be much
                                    lower. For advanced users aiming for
                                    specific breeding outcomes.
                                </p>
                            ) : (
                                <p>
                                    <b>Click to switch mode</b> Phenotype mode
                                    calculates odds based on achieving a desired
                                    look (e.g., "Steppes"), accepting any
                                    genotype that produces it. Recommended for
                                    most users. Match scores will be higher and
                                    "possible" goals more common. Recommended
                                    for most users.
                                </p>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
                <AlertDialogContent className="bg-barely-lilac">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Switch to {newMode} mode?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will change how breeding predictions are
                            calculated for this goal.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleModeSwitch}
                            disabled={isSwitchingMode}
                        >
                            {isSwitchingMode && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Conversion Dialog */}
            <Dialog
                open={isConversionDialogOpen}
                onOpenChange={setIsConversionDialogOpen}
            >
                <DialogContent className="bg-barely-lilac">
                    <DialogHeader>
                        <DialogTitle className="text-pompaca-purple">
                            Resolve Ambiguous Genes
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                        <p className="text-sm text-dusk-purple">
                            To switch to Genotype Mode, please select a specific
                            genotype for each trait.
                        </p>
                        {ambiguousCategories.map((cat) => (
                            <div key={cat.category} className="mt-2">
                                <Label className="text-pompaca-purple">
                                    {cat.category} ({cat.phenotype})
                                </Label>
                                <Select
                                    onValueChange={(value) =>
                                        setConversionSelections((prev) => ({
                                            ...prev,
                                            [cat.category]: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="bg-barely-lilac text-pompaca-purple">
                                        <SelectValue placeholder="Select a specific genotype..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-barely-lilac text-pompaca-purple">
                                        {cat.options?.map((opt: any) => (
                                            <SelectItem
                                                key={opt.genotype}
                                                value={opt.genotype}
                                            >
                                                {opt.genotype}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                    <Button
                        onClick={handleConversionSubmit}
                        disabled={isSwitchingMode}
                    >
                        {isSwitchingMode
                            ? "Saving..."
                            : "Confirm & Switch Mode"}
                    </Button>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
