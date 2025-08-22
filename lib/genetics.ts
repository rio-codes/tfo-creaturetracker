import type { ResearchGoal, Creature } from "@/types";
import { structuredGeneData } from "@/lib/creature-data"; // Your master gene data

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
            // Loop through each gene in the gamete (e.g., for 'aB', loop for 'a' then 'B')
            for (let i = 0; i < maleGamete.length; i++) {
                // Combine the alleles from the same gene locus
                const locusAlleles = [maleGamete[i], femaleGamete[i]];
                // Sort them to enforce standard notation (e.g., 'aA' becomes 'Aa')
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

function getGeneFromGeneticsString(
    fullGenetics: string | null,
    category: string
): string | null {
    if (!fullGenetics) return null;
    const match = fullGenetics.match(new RegExp(`${category}:([a-zA-Z]+)`));
    return match ? match[1] : null;
}

export function calculateGeneProbability(
    maleParent: Creature,
    femaleParent: Creature,
    category: string,
    target: { genotype: string; phenotype: string },
    goalMode: "genotype" | "phenotype"
): number {
    const maleGene = getGeneFromGeneticsString(maleParent.genetics, category);
    const femaleGene = getGeneFromGeneticsString(
        femaleParent.genetics,
        category
    );

    if (!maleGene || !femaleGene) return 0;

    const offspringProbabilities = calculatePunnettSquare(maleGene, femaleGene);

    if (goalMode === "genotype") {
        // In genotype mode, we only care about the specific target genotype.
        return offspringProbabilities.get(target.genotype) || 0;
    } else {
        // In phenotype mode, we need to find all genotypes that produce the target phenotype.
        const speciesData = structuredGeneData[maleParent.species || ""];
        if (!speciesData) return 0;

        const categoryData = speciesData[category] as {
            genotype: string;
            phenotype: string;
        }[];
        if (!categoryData) return 0;

        const genotypesForPhenotype = categoryData
            .filter((gene) => gene.phenotype === target.phenotype)
            .map((gene) => gene.genotype);

        // Sum the probabilities of all matching genotypes.
        let totalProbability = 0;
        for (const genotype of genotypesForPhenotype) {
            totalProbability += offspringProbabilities.get(genotype) || 0;
        }
        return totalProbability;
    }
}
