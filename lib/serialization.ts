import type { DbCreature, DbResearchGoal, EnrichedCreature, EnrichedResearchGoal } from '@/types';
import { structuredGeneData } from '@/constants/creature-data';
import { getPhenotypeForGenotype } from './genetics-utils';

// serialize dates and add rich gene data to creature object
export const enrichAndSerializeCreature = (creature: DbCreature | null): EnrichedCreature => {
    if (!creature) return null;
    const speciesGeneData = structuredGeneData[creature.species || ''];
    return {
        ...creature,
        createdAt: creature.createdAt.toISOString(),
        updatedAt: creature.updatedAt.toISOString(),
        gottenAt: creature.gottenAt ? creature.gottenAt.toISOString() : null,
        generation: creature.generation,
        origin: creature.origin,
        geneData:
            creature.genetics
                ?.split(',')
                .map((genePair) => {
                    const [category, genotype] = genePair.split(':');
                    if (!category || !genotype || !speciesGeneData) return null;
                    const phenotype = getPhenotypeForGenotype(
                        creature.species!,
                        category,
                        genotype,
                        creature.gender as 'Male' | 'Female'
                    );
                    return {
                        category,
                        genotype,
                        phenotype: phenotype,
                    };
                })
                .filter(
                    (
                        gene
                    ): gene is {
                        category: string;
                        genotype: string;
                        phenotype: string;
                    } => gene !== null
                ) || [],
    };
};

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
            if (typeof selection === 'object' && selection.phenotype && selection.genotype) {
                finalGenotype = selection.genotype;
                finalPhenotype = selection.phenotype;
            } else if (typeof selection === 'string') {
                finalGenotype = selection;
                const categoryData = speciesGeneData[category] as {
                    genotype: string;
                    phenotype: string;
                }[];
                const matchedGene = categoryData?.find((g) => g.genotype === finalGenotype);
                finalPhenotype = matchedGene?.phenotype || 'Unknown';
            } else continue;

            let isMulti = false;
            if (goalMode === 'phenotype') {
                const categoryData = speciesGeneData[category];
                for (const gene of categoryData as { genotype: string; phenotype: string }[]) {
                    if (gene.phenotype === finalPhenotype) {
                        finalGenotype = gene.genotype;
                        break;
                    }
                }
            } else {
                const categoryData = speciesGeneData[category] as {
                    genotype: string;
                    phenotype: string;
                }[];
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
    return {
        ...goal,
        genes: enrichedGenes,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
    };
};
