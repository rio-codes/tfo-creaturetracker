'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreatureCombobox } from '@/components/misc-custom-components/creature-combobox';
import { Loader2, Target, Plus } from 'lucide-react';
import type { EnrichedCreature } from '@/types';
import { structuredGeneData } from '@/constants/creature-data';

type AssignCreatureDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    checklistId: string;
    phenotypeString: string;
    phenotypes: { category: string; phenotype: string }[];
    species: string;
    allCreatures: EnrichedCreature[];
};

export function AssignCreatureDialog({
    isOpen,
    onOpenChange,
    checklistId,
    phenotypeString,
    phenotypes,
    species,
    allCreatures,
}: AssignCreatureDialogProps) {
    const router = useRouter();
    const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const defaultGoalName = useMemo(() => {
        const rawName = `${species} - ${phenotypeString}`;
        return rawName.length > 32 ? rawName.slice(0, 32) : rawName;
    }, [species, phenotypeString]);

    const [goalName, setGoalName] = useState(defaultGoalName);
    const [isCreatingGoal, setIsCreatingGoal] = useState(false);

    useEffect(() => {
        setGoalName(defaultGoalName);
    }, [defaultGoalName]);

    const suitableCreatures = useMemo(() => {
        return allCreatures.filter((creature) => {
            if (creature?.species !== species) return false;
            return phenotypes.every((pheno) => {
                const creatureGene = creature.geneData.find((g) => g.category === pheno.category);
                return creatureGene?.phenotype === pheno.phenotype;
            });
        });
    }, [allCreatures, species, phenotypes]);

    const handleAssign = async () => {
        setIsLoading(true);
        try {
            const creatureToAssign = allCreatures.find((c) => c?.id === selectedCreatureId);
            const creatureIdentifier = creatureToAssign
                ? { userId: creatureToAssign.userId, code: creatureToAssign.code }
                : null;

            const response = await fetch(`/api/checklists/${checklistId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phenotypeString,
                    creature: creatureIdentifier,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to assign creature.');
            }

            toast.success('Creature assigned successfully!');
            router.refresh();
            onOpenChange(false);
        } catch (error: any) {
            toast.error('Assignment Failed', { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGoal = async () => {
        if (!goalName.trim()) {
            toast.error('Goal name cannot be empty');
            return;
        }
        setIsCreatingGoal(true);
        try {
            const speciesData = structuredGeneData[species];
            if (!speciesData) throw new Error(`Species "${species}" data not found.`);

            const targetMap = new Map(phenotypes.map((p) => [p.category, p.phenotype]));
            const genes: Record<string, any> = {};

            for (const [category, catGenes] of Object.entries(speciesData)) {
                if (!Array.isArray(catGenes)) continue;
                const targetPhenotype = targetMap.get(category);

                if (targetPhenotype) {
                    const matchedGene = catGenes.find((g) => g.phenotype === targetPhenotype);
                    if (matchedGene) {
                        const genotypesForPhenotype = catGenes.filter(
                            (g) => g.phenotype === targetPhenotype
                        );
                        genes[category] = {
                            genotype: matchedGene.genotype,
                            phenotype: matchedGene.phenotype,
                            isMultiGenotype: genotypesForPhenotype.length > 1,
                            isOptional: false,
                        };
                    }
                } else {
                    const defaultGene = catGenes[0];
                    if (defaultGene) {
                        genes[category] = {
                            genotype: defaultGene.genotype,
                            phenotype: defaultGene.phenotype,
                            isMultiGenotype: false,
                            isOptional: true,
                        };
                    }
                }
            }

            const response = await fetch('/api/research-goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: goalName.trim().slice(0, 32),
                    species,
                    goalMode: 'phenotype',
                    gender: 'female',
                    isPublic: false,
                    genes,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create research goal.');
            }

            toast.success(`Research goal "${goalName}" created!`);
            router.refresh();
            onOpenChange(false);
        } catch (error: any) {
            toast.error('Failed to Create Goal', { description: error.message });
        } finally {
            setIsCreatingGoal(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet max-w-lg">
                <DialogHeader>
                    <DialogTitle>Checklist Slot: {phenotypeString}</DialogTitle>
                    <DialogDescription>
                        Assign a creature from your collection or create a research goal for missing trait(s).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Section 1: Assign Creature */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-sm">Assign Matching Creature</Label>
                        <CreatureCombobox
                            creatures={suitableCreatures}
                            selectedCreatureId={selectedCreatureId ?? undefined}
                            onSelectCreature={(id) => setSelectedCreatureId(id ?? null)}
                            placeholder="Select a matching creature..."
                        />
                        <div className="flex justify-end pt-1">
                            <Button
                                size="sm"
                                onClick={handleAssign}
                                disabled={isLoading || !selectedCreatureId}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Assign Creature
                            </Button>
                        </div>
                    </div>

                    <div className="border-t border-pompaca-purple/20 dark:border-purple-400/20" />

                    {/* Section 2: Create Research Goal */}
                    <div className="space-y-3 bg-white/40 dark:bg-black/20 p-3 rounded-lg border border-pompaca-purple/20">
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-pompaca-purple dark:text-purple-300" />
                            <span className="font-semibold text-sm">Create Goal for Missing Trait(s)</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Creates a research goal for <strong>{phenotypeString}</strong> with all other traits marked as optional.
                        </p>
                        <div className="space-y-1">
                            <Label htmlFor="goal-name-input" className="text-xs font-medium">Goal Name</Label>
                            <Input
                                id="goal-name-input"
                                value={goalName}
                                onChange={(e) => setGoalName(e.target.value)}
                                maxLength={32}
                                className="bg-white dark:bg-slate-900 text-xs"
                                placeholder="Enter goal name..."
                            />
                        </div>
                        <div className="flex justify-end pt-1">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCreateGoal}
                                disabled={isCreatingGoal || !goalName.trim()}
                                className="bg-pompaca-purple text-barely-lilac hover:bg-pompaca-purple/90 dark:bg-purple-400 dark:text-slate-950"
                            >
                                {isCreatingGoal ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                Create Research Goal
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
