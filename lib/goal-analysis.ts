import type { EnrichedCreature, EnrichedResearchGoal } from '@/types';

export const analyzeProgenyAgainstGoal = (
    creature: EnrichedCreature,
    goal: EnrichedResearchGoal,
    excludeGender: boolean = false
): {
    score: number;
    nonMatchingGenes: {
        category: string;
        creatureValue: string;
        goalValue: string;
    }[];
} => {
    const goalGenes = goal.genes;
    if (!creature || !goalGenes || Object.keys(goalGenes).length === 0) {
        return { score: 0, nonMatchingGenes: [] };
    }

    const creatureGenes = (creature.geneData || []).reduce(
        (acc, gene) => {
            acc[gene.category] = gene;
            return acc;
        },
        {} as Record<string, { category: string; genotype: string; phenotype: string }>
    );

    let totalTraits = 0;
    let matchedTraits = 0;
    const nonMatchingGenes: {
        category: string;
        creatureValue: string;
        goalValue: string;
    }[] = [];

    for (const category in goalGenes) {
        if (Object.prototype.hasOwnProperty.call(goalGenes, category)) {
            if ((excludeGender && category === 'Gender') || goalGenes[category].isOptional) {
                continue;
            }
            totalTraits++;
            const goalGene = goalGenes[category];
            const creatureGene = creatureGenes[category];
            const goalValue = goal.goalMode === 'genotype' ? goalGene.genotype : goalGene.phenotype;

            if (!creatureGene) {
                nonMatchingGenes.push({
                    category,
                    creatureValue: 'N/A',
                    goalValue,
                });
                continue;
            }

            const creatureValue =
                goal.goalMode === 'genotype' ? creatureGene.genotype : creatureGene.phenotype;

            if (
                (goal.goalMode === 'genotype' && creatureGene.genotype === goalGene.genotype) ||
                (goal.goalMode === 'phenotype' && creatureGene.phenotype === goalGene.phenotype)
            ) {
                matchedTraits++;
            } else {
                nonMatchingGenes.push({ category, creatureValue, goalValue });
            }
        }
    }

    const score = totalTraits === 0 ? 100 : (matchedTraits / totalTraits) * 100;
    return { score, nonMatchingGenes };
};
