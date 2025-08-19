"use client";

import { useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import type { Creature } from "@/types";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CreatureCard } from "@/components/creature-card";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AddCreaturesDialog } from "@/components/add-creatures-dialog";
import { speciesList } from "@/lib/creature-data";

type CollectionClientProps = {
    initialCreatures: Creature[];
    totalPages: number;
};

export function CollectionClient({ initialCreatures, totalPages }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
    const handleOpenSyncDialog = (creature) => {
        setIsSyncDialogOpen(true);
    };
    const handleCloseDialog = () => {
        setIsSyncDialogOpen(false);
    };

    const handleGenderChange = (
        gender: "male" | "female",
        isChecked: boolean
    ) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");

        const currentGenders = params.get("genders")?.split(",") || [];
        const activeGenders = currentGenders.filter((g) => g);

        if (isChecked) {
            if (!activeGenders.includes(gender)) {
                activeGenders.push(gender);
            }
        } else {
            const index = activeGenders.indexOf(gender);
            if (index > -1) {
                activeGenders.splice(index, 1);
            }
        }

        // Update the 'genders' parameter in the URL
        if (activeGenders.length > 0) {
            // If there are selected genders, join them with a comma.
            params.set("genders", activeGenders.join(","));
        } else {
            // If no genders are selected, set the parameter to an empty string.
            // This is how we tell the server "the user wants to see nothing".
            params.set("genders", "");
        }

        replace(`${pathname}?${params.toString()}`);
    };

    const handleFilterChange = useDebouncedCallback(
        (filterName: string, value: string | boolean) => {
            var params = new URLSearchParams();
            if (filterName == "male" || filterName == "female") {
                params = new URLSearchParams("genders");
            } else {
                params = new URLSearchParams(searchParams);
            }
            params.set("page", "1");

            if (value && value !== "all") {
                params.set(filterName, String(value));
            } else {
                params.delete(filterName);
            }
            replace(`${pathname}?${params.toString()}`);
        },
        300
    ); // 300ms debounce delay

    const currentSpecies = searchParams.get("species") || "all";
    const gendersParam = searchParams.get("genders");
    const currentGenders = gendersParam === null ? "male,female" : gendersParam;
    const currentStage = searchParams.get("stage") || "all";
    const currentQuery = searchParams.get("query") || "";

    return (
        <div className="bg-barely-lilac min-h-screen">
            <div className="container mx-auto px-4 py-5">
                <h1 className="text-5xl font-bold text-pompaca-purple mb-8">
                    Collection
                </h1>
                <Button
                    onClick={handleOpenSyncDialog}
                    className="text-xl mb-8 bg-emoji-eggplant text-barely-lilac drop-shadow-md drop-shadow-gray-500"
                >
                    + Add or Update Creatures
                </Button>

                <AddCreaturesDialog
                    isOpen={isSyncDialogOpen}
                    onClose={handleCloseDialog}
                />
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10" />
                        <Input
                            placeholder="search for a creature..."
                            className="pl-10 bg-ebena-lavender border-pompaca-purple text-pompaca-purple focus-visible:ring-0 placeholder:text-dusk-purple drop-shadow-md drop-shadow-gray-500"
                            defaultValue={currentQuery}
                            onChange={(e) =>
                                handleFilterChange("query", e.target.value)
                            }
                        />
                    </div>

                    {/* Gender Filters */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="female"
                                defaultChecked={currentGenders.includes(
                                    "female"
                                )}
                                onCheckedChange={(checked) =>
                                    handleGenderChange("female", !!checked)
                                }
                            />
                            <Label
                                htmlFor="female"
                                className="text-pompaca-purple font-medium"
                            >
                                Female
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="male"
                                defaultChecked={currentGenders.includes(
                                    "male"
                                )}
                                onCheckedChange={(checked) =>
                                    handleGenderChange("male", !!checked)
                                }
                            />
                            <Label
                                htmlFor="male"
                                className="text-pompaca-purple font-medium"
                            >
                                Male
                            </Label>
                        </div>
                    </div>

                    {/* Stage Filter */}
                    <Select
                        value={currentStage}
                        onValueChange={(e) => handleFilterChange("stage", e)}
                    >
                        <SelectTrigger className="w-32 bg-ebena-lavender text-pompaca-purple border-pompaca-purple drop-shadow-md drop-shadow-gray-500 focus-visible:ring-0">
                            <SelectValue placeholder="Filter by stage..." />
                        </SelectTrigger>
                        <SelectContent className="bg-barely-lilac">
                            <SelectItem value="all" className="bg-barely-lilac">
                                All Stages
                            </SelectItem>
                            <SelectItem
                                value="capsule"
                                className="bg-barely-lilac"
                            >
                                Capsule
                            </SelectItem>
                            <SelectItem
                                value="juvenile"
                                className="bg-barely-lilac"
                            >
                                Juvenile
                            </SelectItem>
                            <SelectItem
                                value="adult"
                                className="bg-barely-lilac"
                            >
                                Adult
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Species Filter */}
                    <Select
                        value={currentSpecies}
                        onValueChange={(value) =>
                            handleFilterChange("species", value)
                        }
                    >
                        <SelectTrigger className="w-48 bg-ebena-lavender text-pompaca-purple border-pompaca-purple drop-shadow-md drop-shadow-gray-500 focus-visible:ring-0">
                            <SelectValue placeholder="Filter by species..." />
                        </SelectTrigger>
                        <SelectContent className="bg-barely-lilac">
                            <SelectItem value="all" className="bg-barely-lilac">
                                All Species
                            </SelectItem>
                            {speciesList.map((species) => {
                                return (
                                    <SelectItem
                                        key={species}
                                        value={species}
                                        className="bg-barely-lilac"
                                    >
                                        {species}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Creature Grid */}
                {initialCreatures.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {initialCreatures.map((creature) => (
                            <CreatureCard
                                key={creature.id}
                                creature={creature}
                                allCreaturesData={initialCreatures}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 bg-ebena-lavender/50 rounded-lg">
                        <h2 className="text-2xl font-semibold text-pompaca-purple">
                            No Creatures Found
                        </h2>
                        <p className="text-dusk-purple mt-2">
                            Try adjusting your filters or use the button above
                            to sync your collection.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                <div className="flex justify-center">
                    <Pagination totalPages={totalPages} />
                </div>
            </div>
        </div>
    );
}
