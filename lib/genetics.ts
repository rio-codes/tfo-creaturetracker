import type { EnrichedCreature } from "@/types";
import { structuredGeneData } from "@/lib/creature-data";

function getGametes(genotype: string): string[] {
    if (!genotype || genotype.length % 2 !== 0) return [];
    const loci = [];
    for (let i = 0; i < genotype.length; i += 2) {
        loci.push([genotype[i], genotype[i + 1]]);
    }
    if (loci.length === 0) return [];
    let results: string[] = [""];
    for (const locus of loci) {
        const newResults: string[] = [];
        for (const allele of locus) {
            for (const result of results) {
                newResults.push(result + allele);
            }
        }
        results = newResults;
    }
    return results;
}

function calculatePunnettSquare(
    maleGene: string,
    femaleGene: string
): Map<string, number> {
    const maleGametes = getGametes(maleGene);
    const femaleGametes = getGametes(femaleGene);
    const offspringCounts = new Map<string, number>();
    const totalOffspring = maleGametes.length * femaleGametes.length;
    if (totalOffspring === 0) return new Map();

    for (const maleGamete of maleGametes) {
        for (const femaleGamete of femaleGametes) {
            const offspringLoci: string[] = [];
            for (let i = 0; i < maleGamete.length; i++) {
                const locusAlleles = [maleGamete[i], femaleGamete[i]];
                locusAlleles.sort();
                offspringLoci.push(locusAlleles.join(""));
            }
            const finalGenotype = offspringLoci.join("");
            offspringCounts.set(
                finalGenotype,
                (offspringCounts.get(finalGenotype) || 0) + 1
            );
        }
    }

    const probabilities = new Map<string, number>();
    for (const [genotype, count] of offspringCounts.entries()) {
        probabilities.set(genotype, count / totalOffspring);
    }

    return probabilities;
}

function getGeneFromEnrichedCreature(
    creature: EnrichedCreature,
    category: string
): string | null {
    if (!creature?.geneData) return null;
    const gene = creature.geneData.find((g) => g.category === category);
    return gene?.genotype || null;
}

export function calculateGeneProbability(
    maleParent: EnrichedCreature,
    femaleParent: EnrichedCreature,
    category: string,
    target: { genotype: string; phenotype: string },
    goalMode: "genotype" | "phenotype"
): number {

    const maleGene = getGeneFromEnrichedCreature(maleParent, category);
    const femaleGene = getGeneFromEnrichedCreature(femaleParent, category);
    if (!maleGene || !femaleGene) {
        return 0;
    }

    const offspringProbabilities = calculatePunnettSquare(maleGene, femaleGene);

    if (goalMode === "genotype") {
        const probability = offspringProbabilities.get(target.genotype) || 0;
        return probability;
    } else {
        const speciesData = structuredGeneData[maleParent.species || ""];
        if (!speciesData) {
            return 0;
        }

        const categoryData = speciesData[category] as {
            genotype: string;
            phenotype: string;
        }[];
        if (!categoryData) {
            return 0;
        }

        const genotypesForPhenotype = categoryData
            .filter((gene) => gene.phenotype === target.phenotype)
            .map((gene) => gene.genotype);

        let totalProbability = 0;
        for (const genotype of genotypesForPhenotype) {
            const chance = offspringProbabilities.get(genotype) || 0;
            totalProbability += chance;
        }
        return totalProbability;
    }
}