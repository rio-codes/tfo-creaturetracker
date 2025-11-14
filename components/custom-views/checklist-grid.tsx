'use client';

import { useState, useMemo } from 'react';
import { generatePhenotypeCombinations, PhenotypeCombination } from '@/lib/checklist-utils';
import { SpeciesAvatar } from '@/components/misc-custom-components/species-avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssignCreatureDialog } from '@/components/custom-dialogs/assign-creature-dialog';
import type { EnrichedChecklist, EnrichedCreature } from '@/types';

type ChecklistGridProps = {
    checklist: EnrichedChecklist;
    allCreatures: EnrichedCreature[];
    isOwner: boolean;
};

export function ChecklistGrid({ checklist, allCreatures, isOwner }: ChecklistGridProps) {
    const { species, targetGenes, id: checklistId } = checklist;

    const assignments = useMemo(() => {
        if (!checklist.assignments) return {};
        try {
            return typeof checklist.assignments === 'string'
                ? JSON.parse(checklist.assignments)
                : checklist.assignments;
        } catch (error) {
            console.error('Failed to parse checklist assignments:', error);
            return {};
        }
    }, [checklist.assignments]);

    const combinations = useMemo(
        () => generatePhenotypeCombinations(species, targetGenes),
        [species, targetGenes]
    );

    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        phenotypeString: string;
        phenotypes: { category: string; phenotype: string }[];
    } | null>(null);

    const creatureMap = useMemo(() => {
        const map = new Map<string, EnrichedCreature>();
        allCreatures.forEach((c) => {
            if (c) map.set(`${c.userId}-${c.code}`, c);
        });
        return map;
    }, [allCreatures]);

    const handleSlotClick = (combo: PhenotypeCombination) => {
        if (!isOwner) return;
        setDialogState({
            isOpen: true,
            phenotypeString: combo.phenotypeString,
            phenotypes: combo.phenotypes,
        });
    };

    return (
        <TooltipProvider>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-2 md:gap-4">
                {combinations.map((combo) => {
                    const assignment = assignments[combo.phenotypeString];
                    const assignedCreature = assignment
                        ? creatureMap.get(`${assignment.userId}-${assignment.code}`)
                        : null;

                    const hasMatchingCreature =
                        !assignedCreature &&
                        isOwner &&
                        allCreatures.some((creature) => {
                            if (!creature || creature.species !== species) return false;
                            const creaturePhenotypes = new Map(
                                creature.geneData.map((g) => [g.category, g.phenotype])
                            );
                            return combo.phenotypes.every(
                                (p) => creaturePhenotypes.get(p.category) === p.phenotype
                            );
                        });

                    return (
                        <Tooltip key={combo.phenotypeString}>
                            <TooltipTrigger asChild>
                                <div
                                    onClick={() => handleSlotClick(combo)}
                                    className={`aspect-square rounded-md flex items-center justify-center transition-all
          ${isOwner ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}
          ${assignedCreature ? 'bg-green-200/50 dark:bg-green-800/50' : 'bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet'}
          ${hasMatchingCreature ? 'border-4 border-green-500 animate-pulse' : ''}`}
                                >
                                    {assignedCreature ? (
                                        <img
                                            src={assignedCreature.imageUrl}
                                            alt={assignedCreature.creatureName || ''}
                                            className="w-full h-full object-contain rounded-md"
                                        />
                                    ) : (
                                        <SpeciesAvatar
                                            species={species}
                                            className="w-3/4 h-3/4 opacity-20"
                                        />
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-pompaca-purple text-barely-lilac">
                                <p className="font-bold">{combo.phenotypeString}</p>
                                {assignedCreature && (
                                    <p className="text-sm">
                                        {assignedCreature.creatureName || 'Unnamed'} (
                                        {assignedCreature.code})
                                    </p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>

            {dialogState && isOwner && (
                <AssignCreatureDialog
                    isOpen={dialogState.isOpen}
                    onOpenChange={(open) => setDialogState(open ? dialogState : null)}
                    checklistId={checklistId}
                    phenotypeString={dialogState.phenotypeString}
                    phenotypes={dialogState.phenotypes}
                    species={species}
                    allCreatures={allCreatures}
                />
            )}
        </TooltipProvider>
    );
}
