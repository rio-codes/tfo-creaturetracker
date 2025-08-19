'use client';

import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Creature } from '@/types/index'

type DialogOverlayProps = {
    isOpen: boolean;
    onClose: () => void;
    // The creature for which you are finding a mate
    baseCreature: Creature | null;
    // The list of all available creatures to filter from
    allCreatures: Creature[];
};

// Dummy data for research goals
const researchGoals = [
    { id: 'rg_001', name: 'Pompaca Flora 001' },
    { id: 'rg_002', name: 'Pompaca Flora 002' },
    { id: 'rg_003', name: 'Ebena Kuranto 001' },
];

export function AddBreedingPairDialog({ isOpen, onClose, baseCreature, allCreatures }: DialogOverlayProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMateCode, setSelectedMateCode] = useState<string | null>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

    // Memoize the filtered list of potential mates
    const potentialMates = useMemo(() => {
        if (!baseCreature) return [];
        return allCreatures.filter(creature =>
        creature.breedName === baseCreature.breedName &&
        creature.gender !== baseCreature.gender &&
        creature.code !== baseCreature.code &&
        creature.code.includes(searchTerm)
        );
    }, [baseCreature, allCreatures, searchTerm]);
    
    if (!isOpen || !baseCreature) {
        return null;
    }

    const handleCreatePair = () => {
        if (!selectedMateCode || !selectedGoalCode) {
            alert("Please select a mate and a research goal.");
            return;
        }
        console.log({
            message: "Creating new breeding pair...",
            baseCreatureCode: baseCreature.code,
            selectedMateCode: selectedMateCode,
            researchGoalCode: selectedGoalId
        });
        // Add your database submission logic here
        onClose(); // Close the dialog after submission
    }

    return (
        // Backdrop
        <div
        className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center"
        onClick={onClose}
        >
        {/* Dialog Box */}
        <div
            className="bg-barely-lilac rounded-lg shadow-xl p-6 space-y-4 w-full max-w-lg z-50 flex flex-col"
            // Stop propagation to prevent closing the dialog when clicking inside it
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-pompaca-purple">Search for mate</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4 text-dusk-purple" />
            </Button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dusk-purple h-4 w-4" />
            <Input
                placeholder={`search for a ${baseCreature.breedName}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-ebena-lavender border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple"
            />
            </div>

            {/* Scrollable Creature List */}
            <div className="border border-pompaca-purple/50 rounded-lg p-2 max-h-48 overflow-y-auto space-y-2 bg-ebena-lavender/30">
            <RadioGroup onValueChange={setSelectedMateId}>
                {potentialMates.length > 0 ? (
                    potentialMates.map(mate => (
                    <div key={mate.id} className="flex items-center space-x-2 bg-barely-lilac p-2 rounded">
                        <img src={mate.image} alt={mate.code} className="h-10 w-10 rounded-full object-cover border-2 border-pompaca-purple" />
                        <Label htmlFor={mate.id} className="flex-1 text-pompaca-purple font-medium">
                            {mate.code}
                        </Label>
                        <RadioGroupItem value={mate.id} id={mate.id} />
                    </div>
                ))
                ) : (
                    <p className="text-center text-dusk-purple p-4">No potential mates found.</p>
                )}
            </RadioGroup>
            </div>

            {/* Research Goal Dropdown */}
            <div className="space-y-2">
                <Label htmlFor="research-goal" className="text-pompaca-purple font-medium">
                    Select a research goal
                </Label>
                <Select onValueChange={setSelectedGoalId}>
                    <SelectTrigger className="w-full bg-ebena-lavender text-pompaca-purple border-pompaca-purple">
                        <SelectValue placeholder="choose a goal..." />
                    </SelectTrigger>
                    <SelectContent>
                        {researchGoals.map(goal => (
                            <SelectItem key={goal.id} value={goal.id}>
                                {goal.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
                <Button variant="ghost" onClick={onClose} className="text-dusk-purple">
                    Cancel
                </Button>
                <Button 
                onClick={handleCreatePair} 
                className="bg-pompaca-purple hover:bg-dusk-purple text-barely-lilac"
                disabled={!selectedMateCode || !selectedGoalId}
                >
                    Create Pair
                </Button>
            </div>
        </div>
        </div>
    );
}