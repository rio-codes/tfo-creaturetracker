import type { EnrichedCreature, GoalGene } from '@/types';
import { structuredGeneData } from '../constants/creature-data';
import { hybridizationRules, OffspringOutcome } from './hybridization-rules';

export type SpeciesBreedingOutcome = {
    species: string;
    probability: number;
    geneOutcomes: OutcomesByCategory;
};

function splitMultiLocusGenotype(genotype: string): string[] {
    return genotype.match(/.{1,2}/g) || [];
}

function getAlleles(genotype: string): [string, string] {
    if (genotype.length === 1) return [genotype, genotype];
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

export function getPossibleOffspringSpecies(
    maleSpecies: string,
    femaleSpecies: string
): OffspringOutcome[] {
    if (maleSpecies === femaleSpecies) {
        return [{ species: maleSpecies, probability: 1 }];
    }

    const rule1 = hybridizationRules[maleSpecies]?.[femaleSpecies];
    if (rule1) return rule1.outcomes;

    const rule2 = hybridizationRules[femaleSpecies]?.[maleSpecies];
    if (rule2) return rule2.outcomes;

    return [];
}

function _calculateOutcomesForCategory(
    maleParent: EnrichedCreature,
    femaleParent: EnrichedCreature,
    category: string,
    offspringSpecies: string
): Outcome[] {
    if (!maleParent?.geneData || !femaleParent?.geneData) return [];

    const speciesGenes = structuredGeneData[offspringSpecies];
    if (!speciesGenes) return [];

    const maleGene = maleParent.geneData.find((g) => g.category === category);
    const femaleGene = femaleParent.geneData.find((g) => g.category === category);

    if (!maleGene && !femaleGene) return [];

    let maleGenotype = maleGene?.genotype;
    let femaleGenotype = femaleGene?.genotype;

    if (!maleGenotype && femaleGenotype) {
        // Ensure the default genotype matches the locus count of the present parent
        maleGenotype = 'aa'.repeat(Math.max(1, femaleGenotype.length / 2));
    } else if (maleGenotype && !femaleGenotype) {
        // Ensure the default genotype matches the locus count of the present parent
        femaleGenotype = 'aa'.repeat(Math.max(1, maleGenotype.length / 2));
    } else if (!maleGenotype && !femaleGenotype) {
        return [];
    }

    const maleLoci = splitMultiLocusGenotype(maleGenotype!);
    const femaleLoci = splitMultiLocusGenotype(femaleGenotype!);
    if (maleLoci.length !== femaleLoci.length || maleLoci.length === 0) return [];

    const outcomesByLocus: {
        [locusIndex: number]: { genotype: string; probability: number }[];
    } = {};

    for (let i = 0; i < maleLoci.length; i++) {
        const maleLocusGenotype = maleLoci[i];
        const femaleLocusGenotype = femaleLoci[i];
        const maleAlleles = getAlleles(maleLocusGenotype);
        const femaleAlleles = getAlleles(femaleLocusGenotype);
        const punnettSquare: { [key: string]: number } = {};
        const sortedMaleAlleles = maleAlleles.sort((a, b) => {
            return a.localeCompare(b, 'en-US', { caseFirst: 'upper' });
        });
        const sortedFemaleAlleles = femaleAlleles.sort((a, b) => {
            return a.localeCompare(b, 'en-US', { caseFirst: 'upper' });
        });
        for (const maleAllele of sortedMaleAlleles) {
            for (const femaleAllele of sortedFemaleAlleles) {
                const childGenotype = [maleAllele, femaleAllele].sort((a, b) =>
                    a.localeCompare(b, 'en-US', { caseFirst: 'upper' })
                );
                const key = childGenotype.join('');
                punnettSquare[key] = (punnettSquare[key] || 0) + 1;
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

    const categoryGeneData = speciesGenes[category];
    if (!Array.isArray(categoryGeneData)) return [];

    return combinedOutcomes.map((combo) => ({
        genotype: (combo.genotype.match(/.{1,2}/g) || []).sort().join(''),
        probability: combo.probability,
        phenotype: getPhenotypeForGenotype(
            // Use the newly sorted genotype for phenotype lookup
            (combo.genotype.match(/.{1,2}/g) || []).sort().join(''),
            categoryGeneData
        ),
    }));
}

export function calculateBreedingOutcomes(
    maleParent: EnrichedCreature,
    femaleParent: EnrichedCreature
): SpeciesBreedingOutcome[] {
    if (!maleParent || !femaleParent) {
        return [];
    }

    const possibleSpecies = getPossibleOffspringSpecies(
        maleParent.species as string,
        femaleParent.species as string
    );
    if (possibleSpecies.length === 0) return [];

    const allOutcomes: SpeciesBreedingOutcome[] = [];

    for (const offspring of possibleSpecies) {
        const { species: offspringSpecies, probability: speciesProbability } = offspring;
        const speciesGenes = structuredGeneData[offspringSpecies];
        if (!speciesGenes) continue;

        if (speciesGenes.hasNoGenetics) {
            allOutcomes.push({
                species: offspringSpecies,
                probability: speciesProbability,
                geneOutcomes: {
                    Gender: [
                        { genotype: 'Female', phenotype: 'Female', probability: 0.5 },
                        { genotype: 'Male', phenotype: 'Male', probability: 0.5 },
                    ],
                },
            });
            continue;
        }

        const geneOutcomes: OutcomesByCategory = {
            Gender: [
                { genotype: 'Female', phenotype: 'Female', probability: 0.5 },
                { genotype: 'Male', phenotype: 'Male', probability: 0.5 },
            ],
        };

        allOutcomes.push({
            species: offspringSpecies,
            probability: speciesProbability,
            geneOutcomes,
        });
    }

    return allOutcomes;
}

export function calculateGeneProbability(
    breedingOutcomes: SpeciesBreedingOutcome[],
    targetSpecies: string,
    category: string,
    targetGene: GoalGene,
    goalMode: 'genotype' | 'phenotype'
): number {
    if (targetGene.isOptional) {
        return 1;
    }
    if (category === 'Gender') {
        return 0.5;
    }

    const speciesOutcome = breedingOutcomes.find((o) => o.species === targetSpecies);
    if (!speciesOutcome) return 0;

    const categoryOutcomes = speciesOutcome.geneOutcomes[category];
    if (!categoryOutcomes) return 0;

    let probability = 0;
    if (goalMode === 'genotype') {
        const matchingOutcome = categoryOutcomes.find((o) => o.genotype === targetGene.genotype);
        probability = matchingOutcome?.probability || 0;
    } else {
        probability = categoryOutcomes
            .filter((o) => o.phenotype === targetGene.phenotype)
            .reduce((sum, o) => sum + o.probability, 0);
    }
    return speciesOutcome.probability * probability;
}
