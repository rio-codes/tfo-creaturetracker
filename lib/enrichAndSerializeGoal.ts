import type { DbResearchGoal, EnrichedResearchGoal } from '@/types';
import { structuredGeneData } from '../constants/creature-data';

// serialize dates and add enriched gene data to research goal object

export const enrichAndSerializeGoal = (
    goal: DbResearchGoal,
    goalMode: 'genotype' | 'phenotype'
): EnrichedResearchGoal => {
    const enrichedGenes: { [key: string]: any } = {};
    const speciesGeneData = structuredGeneData[goal.species];
    if (speciesGeneData && goal.genes && typeof goal.genes === 'object') {
        for (const [category, selection] of Object.entries(goal.genes)) {
            let finalGenotype: string, finalPhenotype: string;
            if (selection) {
                if (
                    typeof selection === 'object' &&
                    'phenotype' in selection &&
                    typeof selection.phenotype === 'string' &&
                    selection.phenotype?.length > 0 &&
                    'genotype' in selection &&
                    typeof selection.genotype === 'string' &&
                    selection.genotype?.length > 0 &&
                    selection.genotype
                ) {
                    finalGenotype = selection.genotype;
                    finalPhenotype = selection.phenotype;
                } else if (typeof selection === 'string') {
                    finalGenotype = selection;
                    type FullGene = {
                        genotype: string;
                        phenotype: string;
                    };

                    type FullGeneSet = FullGene[];

                    const categoryData = speciesGeneData[
                        category
                    ] as FullGeneSet;
                    const matchedGene = categoryData?.find(
                        (g) => g.genotype === finalGenotype
                    );
                    finalPhenotype = matchedGene?.phenotype || 'Unknown';
                } else continue;

                let isMulti = false;
                if (goalMode === 'phenotype') {
                    const categoryData = speciesGeneData[category];
                    const genotypesForPhenotype = categoryData?.filter(
                        (g) => g.phenotype === finalPhenotype
                    );
                    isMulti = (genotypesForPhenotype?.length || 0) > 1;
                }
                enrichedGenes[category] = {
                    genotype: finalGenotype,
                    phenotype: finalPhenotype,
                    isMultiGenotype: isMulti,
                    isOptional: selection.isOptional ?? false,
                };
            }
        }
    }
    return {
        ...goal,
        genes: enrichedGenes,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
    };
};
