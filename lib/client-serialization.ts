import { structuredGeneData } from '@/constants/creature-data';
import type { DbCreature, DbResearchGoal, EnrichedCreature, EnrichedResearchGoal } from '@/types';

export const enrichAndSerializeCreature = (
    creature: (DbCreature & { user?: { username: string | null } | null }) | null
): EnrichedCreature | null => {
    if (!creature) return null;
    return {
        ...creature,
        createdAt: creature.createdAt.toISOString(),
        updatedAt: creature.updatedAt.toISOString(),
        gottenAt: creature.gottenAt ? creature.gottenAt.toISOString() : null,
        generation: creature.generation,
        origin: creature.origin,
        progeny: [],
        geneData:
            typeof creature.genetics === 'string' && creature.genetics.startsWith('{')
                ? Object.entries(JSON.parse(creature.genetics)).map(([category, geneInfo]) => {
                      const gene = geneInfo as { genotype: string; phenotype: string };
                      return {
                          category,
                          genotype: gene.genotype,
                          phenotype: gene.phenotype,
                      };
                  })
                : [],
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
                if (typeof categoryData === 'object' && Array.isArray(categoryData)) {
                    const genotypesForPhenotype = categoryData.filter(
                        (g) => g.phenotype === finalPhenotype
                    );
                    isMulti = (genotypesForPhenotype?.length || 0) > 1;
                }
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
        excludedGenes: goal.excludedGenes,
        assignedPairIds: goal.assignedPairIds,
    };
};
