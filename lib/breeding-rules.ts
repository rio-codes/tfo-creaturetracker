import 'server-only';

import type { CreatureKey, DbCreature, DbResearchGoal } from '@/types';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/client-serialization';
import { getCreatureAncestors } from './creature-utils';

export function checkGoalAchieved(progeny: DbCreature, goal: DbResearchGoal): boolean {
    if (progeny.species !== goal.species) {
        return false;
    }

    const enrichedProgeny = enrichAndSerializeCreature(progeny);
    const enrichedGoal = enrichAndSerializeGoal(goal, goal.goalMode);

    if (!enrichedProgeny || !enrichedGoal) return false;

    const progenyGenes = new Map(enrichedProgeny.geneData.map((g) => [g.category, g]));

    for (const [category, targetGene] of Object.entries(enrichedGoal.genes)) {
        if (category === 'Gender') continue;

        // Check for exclusions on optional genes
        if (targetGene.isOptional) {
            const excludedPhenotypes = enrichedGoal.excludedGenes?.[category]?.phenotype;
            const progenyPhenotype = progenyGenes.get(category)?.phenotype;
            if (progenyPhenotype && excludedPhenotypes?.includes(progenyPhenotype)) return false;
        }

        const progenyGene = progenyGenes.get(category);
        if (!progenyGene) {
            return false; // Progeny is missing a required gene category
        }

        if (enrichedGoal.goalMode === 'genotype') {
            if (progenyGene.genotype !== targetGene.genotype) {
                return false;
            }
        } else {
            // phenotype mode
            if (progenyGene.phenotype !== targetGene.phenotype) {
                return false;
            }
        }
    }

    return true;
}

export async function checkForInbreeding(
    maleKey: CreatureKey,
    femaleKey: CreatureKey
): Promise<boolean> {
    if (!maleKey?.userId || !femaleKey?.userId) {
        return false;
    }

    if (maleKey.userId === femaleKey.userId && maleKey.code === femaleKey.code) {
        return false;
    }

    const [maleAncestorKeys, femaleAncestorKeys] = await Promise.all([
        getCreatureAncestors(maleKey, maleKey.userId),
        getCreatureAncestors(femaleKey, femaleKey.userId),
    ]);

    const maleAncestors = new Set(maleAncestorKeys.map((k) => `${k.userId}-${k.code}`));
    const femaleAncestors = new Set(femaleAncestorKeys.map((k) => `${k.userId}-${k.code}`));

    if (maleAncestors.has(`${femaleKey.userId}-${femaleKey.code}`)) return true;

    if (femaleAncestors.has(`${maleKey.userId}-${maleKey.code}`)) return true;

    for (const ancestor of maleAncestors) {
        if (femaleAncestors.has(ancestor)) {
            return true;
        }
    }
    return false;
}
