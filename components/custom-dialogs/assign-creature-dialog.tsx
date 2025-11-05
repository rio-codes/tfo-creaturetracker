'use client';

import { useState, useMemo } from 'react';
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
import { CreatureCombobox } from '@/components/misc-custom-components/creature-combobox';
import { Loader2 } from 'lucide-react';
import type { EnrichedCreature } from '@/types';

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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet">
                <DialogHeader>
                    <DialogTitle>Assign Creature to Slot</DialogTitle>
                    <DialogDescription>
                        Select a creature from your collection that matches the phenotype:{' '}
                        <strong>{phenotypeString}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <CreatureCombobox
                        creatures={suitableCreatures}
                        selectedCreatureId={selectedCreatureId ?? undefined}
                        onSelectCreature={(id) => setSelectedCreatureId(id ?? null)}
                        placeholder="Select a matching creature..."
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={isLoading || !selectedCreatureId}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Creature
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
