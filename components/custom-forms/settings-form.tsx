"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { structuredGeneData } from "@/lib/creature-data";
import { User, ResearchGoal } from "@/types"

export function SettingsForm({
    user,
    goals,
}: {
    user: User;
    goals: ResearchGoal[];
}) {
    const router = useRouter();
    const { update: updateSession } = useSession();

    // Form state
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [goalMode, setGoalMode] = useState(user.goalMode);
    const [collectionItems, setCollectionItems] = useState(user.collectionItemsPerPage);
    const [goalsItems, setGoalsItems] = useState(user.goalsItemsPerPage);
    const [pairsItems, setPairsItems] = useState(user.pairsItemsPerPage);
    // State for the conversion flow
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isConversionDialogOpen, setIsConversionDialogOpen] = useState(false);
    const [goalsToConvert, setGoalsToConvert] = useState<any[]>([]);
    const [conversionSelections, setConversionSelections] = useState<{
        [key: string]: any;
    }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        if (user.goalMode === "phenotype" && goalMode === "genotype") {
            console.group("--- Goal Conversion Check ---");
            console.log(
                `Switching from '${user.goalMode}' to '${goalMode}'. Checking for ambiguous goals...`
            );
            console.log("Total goals to check:", goals);

            const ambiguousGoals = [];
            for (const goal of goals) {
                console.log(
                    `%cChecking goal: "${goal.name}" (Species: ${goal.species})`,
                    "font-weight: bold;"
                );
                const ambiguousCategories = [];
                const speciesGeneData = structuredGeneData[goal.species];

                if (!speciesGeneData) {
                    console.warn(
                        `  - No master gene data found for species: ${goal.species}. Skipping.`
                    );
                    continue;
                }

                for (const [category, geneSelection] of Object.entries(
                    goal.genes
                )) {
                    let targetPhenotype: string | undefined;

                    // Intelligently determine the phenotype based on the data structure.
                    if (
                        typeof geneSelection === "object" &&
                        geneSelection.phenotype
                    ) {
                        targetPhenotype = geneSelection.phenotype;
                    } else if (typeof geneSelection === "string") {
                        const categoryData = speciesGeneData[category] as {
                            genotype: string;
                            phenotype: string;
                        }[];
                        const matchedGene = categoryData?.find(
                            (g) => g.genotype === geneSelection
                        );
                        targetPhenotype = matchedGene?.phenotype;
                    }

                    if (!targetPhenotype) {
                        continue;
                    }

                    const allGenesForPhenotype = speciesGeneData[
                        category
                    ]?.filter((g) => g.phenotype === targetPhenotype);

                    const matchCount = allGenesForPhenotype?.length || 0;

                    if (matchCount > 1) {
                        ambiguousCategories.push({
                            category,
                            phenotype: targetPhenotype,
                            options: allGenesForPhenotype,
                        });
                    }
                }
                if (ambiguousCategories.length > 0) {
                    ambiguousGoals.push({ ...goal, ambiguousCategories });
                }
            }

            if (ambiguousGoals.length > 0) {
                setGoalsToConvert(ambiguousGoals);
                setIsConversionDialogOpen(true);
                setIsLoading(false);
                return;
            }
        }

        // If no conversion is needed, proceed with the normal save
        await saveSettings();
    };

    const handleConversionSelection = (
        goalId: string,
        category: string,
        genotype: string,
        phenotype: string
    ) => {
        setConversionSelections((prev) => ({
            ...prev,
            [goalId]: {
                ...prev[goalId],
                [category]: { genotype, phenotype },
            },
        }));
    };

    const saveSettings = async (goalConversions?: any) => {
        setIsLoading(true);
        try {
            const payload: any = {
                goalMode,
                collectionItemsPerPage: collectionItems,
                goalsItemsPerPage: goalsItems,
                pairsItemsPerPage: pairsItems,
            };
            if (email !== user.email) payload.email = email;
            if (password) payload.password = password;
            if (goalConversions) payload.goalConversions = goalConversions;

            const response = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok)
                setError("Failed to update settings. " + data.error)

            setSuccessMessage(data.message);
            if (email !== user.email) await updateSession({ user: { email } });
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            setIsConversionDialogOpen(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Account Settings Section */}
                <div className="p-6 bg-ebena-lavender rounded-lg border border-pompaca-purple/50 text-pompaca-purple">
                    <h2 className="text-2xl font-bold mb-4">Account</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-barely-lilac"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Leave blank to keep current"
                                    className="bg-barely-lilac"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">
                                    Confirm New Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="bg-barely-lilac"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="p-6 bg-ebena-lavender rounded-lg border border-pompaca-purple/50 text-pompaca-purple">
                    <h2 className="text-2xl font-bold text-pompaca-purple mb-4">
                        Preferences
                    </h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="collection-items"
                                className="text-lg"
                            >
                                Items per page in Collection
                            </Label>
                            <Input
                                id="collection-items"
                                type="number"
                                value={collectionItems}
                                onChange={(e) =>
                                    setCollectionItems(Number(e.target.value))
                                }
                                min="3"
                                max="30"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="research-goal-items"
                                className="text-lg"
                            >
                                Items per page in Research Goals
                            </Label>
                            <Input
                                id="research-goal-items"
                                type="number"
                                value={goalsItems}
                                onChange={(e) =>
                                    setGoalsItems(Number(e.target.value))
                                }
                                min="3"
                                max="30"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="breeding-pair-items"
                                className="text-lg"
                            >
                                Items per page in Breeding Pairs
                            </Label>
                            <Input
                                id="breeding-pair-items"
                                type="number"
                                value={pairsItems}
                                onChange={(e) =>
                                    setPairsItems(Number(e.target.value))
                                }
                                min="3"
                                max="30"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4">
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {successMessage && (
                        <p className="text-sm text-green-600">
                            {successMessage}
                        </p>
                    )}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-pompaca-purple hover:bg-dusk-purple text-barely-lilac"
                    >
                        {isLoading ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </form>

            {/* Goal Mode Conversion Dialog */}
            <Dialog
                open={isConversionDialogOpen}
                onOpenChange={setIsConversionDialogOpen}
            >
                <DialogContent className="bg-barely-lilac">
                    <DialogHeader>
                        <DialogTitle className="text-pompaca-purple">
                            Resolve Ambiguous Goals
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                        <p className="text-sm text-dusk-purple">...</p>
                        {goalsToConvert.map((goal) => (
                            <div
                                key={goal.id}
                                className="p-4 border rounded-md bg-ebena-lavender"
                            >
                                <h3 className="font-bold text-pompaca-purple">
                                    {goal.name}
                                </h3>
                                {goal.ambiguousCategories.map((cat: any) => (
                                    <div key={cat.category} className="mt-2">
                                        <Label>
                                            {cat.category} ({cat.phenotype})
                                        </Label>

                                        <Select
                                            onValueChange={(value) =>
                                                handleConversionSelection(
                                                    goal.id,
                                                    cat.category,
                                                    value,
                                                    cat.phenotype
                                                )
                                            }
                                        >
                                            <SelectTrigger className="bg-barely-lilac">
                                                <SelectValue placeholder="Select a specific genotype..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-barely-lilac">
                                                {cat.options.map((opt: any) => (
                                                    <SelectItem
                                                        key={opt.genotype}
                                                        value={opt.genotype}
                                                        className="bg-barely-lilac"
                                                    >
                                                        {opt.genotype}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <Button
                        onClick={() => saveSettings(conversionSelections)}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Saving..."
                            : "Confirm Selections & Save Settings"}
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    );
}
