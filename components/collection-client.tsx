"use client"
import { useState, useMemo } from 'react';
import type { Creature } from '@/types';
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CreatureCard } from "@/components/creature-card"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AddCreaturesDialog } from "@/components/add-creatures-dialog"
import { speciesList } from "@/app/lib/creature_data"

type CollectionClientProps = {
    initialCreatures: Creature[];
};

export function CollectionClient({initialCreatures = []}) {
    const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFemale, setShowFemale] = useState(true);
    const [showMale, setShowMale] = useState(true);
    const [selectedBreed, setSelectedBreed] = useState("all")
    const [selectedStage, setSelectedStage] = useState("adult")

    const handleOpenSyncDialog = (creature) => {
        setIsSyncDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsSyncDialogOpen(false);
    };

    const speciesIds = []
    speciesIds.push(speciesList.map((species) => species.toLowerCase().replace(" ","-")))

    // Filter the initial data based on the current state
    const filteredCreatures = useMemo(() => {
        return initialCreatures.filter(creature => {
            console.log(creature)
            const searchMatch = creature.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                creature.creatureName.includes(searchTerm.toLowerCase());
            
            const genderMatch = (showFemale && creature.gender === 'female') ||
                                (showMale && creature.gender === 'male');

            const stageMatch =  (selectedStage === "capsule" && creature.growthLevel === 1) ||
                                (selectedStage === "juvenile" && creature.growthLevel === 2) ||
                                (selectedStage === "adult" && creature.growthLevel === 3);
            
            const speciesMatch =    selectedBreed === "all" || 
                                    selectedBreed === creature.species?.toLowerCase().replace(" ", "-");

            return searchMatch && genderMatch && stageMatch && speciesMatch;
        });
    }, [initialCreatures, searchTerm, showFemale, showMale, selectedStage, selectedBreed]);

    return (
        <div className="bg-barely-lilac min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-pompaca-purple mb-8">Collection</h1>
                <Button onClick={handleOpenSyncDialog} className="text-xl mb-8 bg-emoji-eggplant text-barely-lilac">
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
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dusk-purple h-4 w-4" />
                        <Input
                            placeholder="search for a creature by name or code..."
                            className="pl-10 bg-ebena-lavender border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Gender Filters */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="female" checked={showFemale} onCheckedChange={(checked) => setShowFemale(!!checked)} className="border-pompaca-purple" />
                            <Label htmlFor="female" className="text-pompaca-purple font-medium">
                                Female
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="male" checked={showMale} onCheckedChange={(checked) => setShowMale(!!checked)} className="border-pompaca-purple" />
                            <Label htmlFor="male" className="text-pompaca-purple font-medium">
                                Male
                            </Label>
                        </div>
                    </div>

                    {/* Stage Filter */}
                    <Select value={selectedStage}
                        onValueChange={(value) => setSelectedStage(value)}
                    >
                        <SelectTrigger className="w-32 bg-ebena-lavender text-pompaca-purple border-pompaca-purple">
                            <SelectValue placeholder="Filter by stage..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="capsule">Capsule</SelectItem>
                            <SelectItem value="juvenile">Juvenile</SelectItem>
                            <SelectItem value="adult">Adult</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Species Filter */}
                    <Select
                        value={selectedBreed}
                        onValueChange={(value) => setSelectedBreed(value)}
                    >
                        <SelectTrigger className="w-48 bg-ebena-lavender text-pompaca-purple border-pompaca-purple">
                            <SelectValue placeholder="Filter by species..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className='bg-barely-lilac'>All Species</SelectItem>
                                {speciesList.map((species) => {
                                    const itemValue = species.toLowerCase().replace(' ', '-');
                                    return (
                                        <SelectItem key={itemValue} value={itemValue} className='bg-barely-lilac'>
                                        {species}
                                        </SelectItem>
                                    );
                                })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Creature Grid */}
                {(filteredCreatures.length > 0)? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {filteredCreatures.map((creature) => <CreatureCard creature={creature} allCreaturesData={initialCreatures}/>)}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 bg-ebena-lavender/50 rounded-lg">
                        <h2 className="text-2xl font-semibold text-pompaca-purple">No Creatures Found</h2>
                        <p className="text-dusk-purple mt-2">
                            Try adjusting your filters or use the button above to sync your collection.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                <Pagination currentPage={1} totalPages={1} />
            </div>
        </div>
    )
}
