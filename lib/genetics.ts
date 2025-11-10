import type { EnrichedCreature, GoalGene, OffspringOutcome } from '@/types';
import { structuredGeneData } from '../constants/creature-data';
import {
    hybridizationRules,
    OffspringOutcome as HybridizationOffspringOutcome,
} from './hybridization-rules';

// NEW helper to split multi-locus genotypes
function splitMultiLocusGenotype(genotype: string): string[] {
    // Splits 'AABBcc' into ['AA', 'BB', 'cc']
    return genotype.match(/.{1,2}/g) || [];
}

function getAlleles(genotype: string): [string, string] {
    if (genotype.length === 1) return [genotype, genotype];
    // Handles cases like 'Aa' or 'AA'
    return [genotype[0], genotype[1]];
}

type Outcome = {
    genotype: string;
    phenotype: string;
    probability: number;
};

export type OutcomesByCategory = {
    [category: string]: Outcome[];
};

function getPhenotypeForGenotype(
    genotype: string,
    categoryGeneData: { genotype: string; phenotype: string }[]
): string {
    const directMatch = categoryGeneData.find((g) => g.genotype === genotype);
    if (directMatch) {
        return directMatch.phenotype;
    }
    return 'Unknown';
}

// NEW helper to calculate all outcomes for a single category, handling multi-locus genes
function calculateOutcomesForCategory(
    maleParent: EnrichedCreature,
    femaleParent: EnrichedCreature,
    category: string
): Outcome[] {
    if (!maleParent || !femaleParent || !maleParent.geneData || !femaleParent.geneData) return [];
    const species = maleParent.species;
    if (!species || !structuredGeneData[species]) return [];
    const speciesGenes = structuredGeneData[species];

    const maleGene = maleParent.geneData.find((g) => g.category === category);
    const femaleGene = femaleParent.geneData.find((g) => g.category === category);
    if (!maleGene || !femaleGene) return [];

    const maleLoci = splitMultiLocusGenotype(maleGene.genotype);
    const femaleLoci = splitMultiLocusGenotype(femaleGene.genotype);
    if (maleLoci.length !== femaleLoci.length) return [];
    if (maleLoci.length === 0) return [];

    const outcomesByLocus: {
        [locusIndex: number]: { genotype: string; probability: number }[];
    } = {};

    for (let i = 0; i < maleLoci.length; i++) {
        const maleLocusGenotype = maleLoci[i];
        const femaleLocusGenotype = femaleLoci[i];
        const maleAlleles = getAlleles(maleLocusGenotype);
        const femaleAlleles = getAlleles(femaleLocusGenotype);
        const punnettSquare: { [key: string]: number } = {};
        for (const maleAllele of maleAlleles) {
            for (const femaleAllele of femaleAlleles) {
                const offspringGenotype = [maleAllele, femaleAllele].sort().join('');
                punnettSquare[offspringGenotype] = (punnettSquare[offspringGenotype] || 0) + 1;
            }
        }

        const locusOutcomes: { genotype: string; probability: number }[] = [];
        const totalOutcomes = 4;
        for (const genotype in punnettSquare) {
            locusOutcomes.push({
                genotype,
                probability: punnettSquare[genotype] / totalOutcomes,
            });
        }
        outcomesByLocus[i] = locusOutcomes;
    }

    let combinedOutcomes: { genotype: string; probability: number }[] = [
        { genotype: '', probability: 1 },
    ];
    for (let i = 0; i < maleLoci.length; i++) {
        const newCombinedOutcomes: { genotype: string; probability: number }[] = [];
        const locusOutcomes = outcomesByLocus[i];
        for (const existingOutcome of combinedOutcomes) {
            for (const locusOutcome of locusOutcomes) {
                newCombinedOutcomes.push({
                    genotype: existingOutcome.genotype + locusOutcome.genotype,
                    probability: existingOutcome.probability * locusOutcome.probability,
                });
            }
        }
        combinedOutcomes = newCombinedOutcomes;
    }

    return combinedOutcomes.map((combo) => ({
        ...combo,
        phenotype: getPhenotypeForGenotype(combo.genotype, speciesGenes[category] as any),
    }));
}

export function calculateBreedingOutcomes(
    maleParent: EnrichedCreature,
    femaleParent: EnrichedCreature
): OffspringOutcome[] {
    if (!maleParent?.species || !femaleParent?.species) {
        return [];
    }

    if (maleParent.species === femaleParent.species) {
        return [
            {
                species: maleParent.species,
                probability: 1,
                geneOutcomes: {},
            },
        ];
    }

    const rule =
        (hybridizationRules[maleParent.species]?.[femaleParent.species] as {
            outcomes: HybridizationOffspringOutcome[];
        }) ||
        (hybridizationRules[femaleParent.species]?.[maleParent.species] as {
            outcomes: HybridizationOffspringOutcome[];
        });

    if (rule) {
        return rule.outcomes.map((outcome) => ({ ...outcome, geneOutcomes: {} }));
    }

    return [];
}

export function calculateAllPossibleOutcomes(
    maleParent: EnrichedCreature,
    femaleParent: EnrichedCreature
): OutcomesByCategory {
    if (!maleParent || !femaleParent || !maleParent.geneData || !femaleParent.geneData) {
        return {};
    }

    const species = maleParent.species;
    if (!species || !structuredGeneData[species]) return {};

    const outcomes: OutcomesByCategory = {};
    const speciesGenes = structuredGeneData[species];

    for (const category in speciesGenes) {
        if (category === 'Gender') continue;
        const categoryOutcomes = calculateOutcomesForCategory(maleParent, femaleParent, category);
        if (categoryOutcomes.length > 0) {
            outcomes[category] = categoryOutcomes.sort((a, b) => b.probability - a.probability);
        }
    }

    return outcomes;
}

export function calculateGeneProbability(
    maleParent: EnrichedCreature,
    femaleParent: EnrichedCreature,
    category: string,
    targetGene: GoalGene,
    goalMode: 'genotype' | 'phenotype'
): number {
    if (targetGene.isOptional) {
        return 1;
    }

    if (!maleParent?.geneData || !femaleParent?.geneData) {
        return 0;
    }

    const allOutcomes = calculateOutcomesForCategory(maleParent, femaleParent, category);
    if (allOutcomes.length === 0) return 0;

    if (goalMode === 'genotype') {
        const matchingOutcome = allOutcomes.find((o) => o.genotype === targetGene.genotype);
        return matchingOutcome?.probability || 0;
    } else {
        // phenotype mode
        const matchingPhenotypeProb = allOutcomes
            .filter((o) => o.phenotype === targetGene.phenotype)
            .reduce((sum, o) => sum + o.probability, 0);
        return matchingPhenotypeProb;
    }
}
