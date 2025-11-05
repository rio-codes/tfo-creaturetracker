import { structuredGeneData } from '@/constants/creature-data';

type TargetGene = {
    category: string;
    geneCount: number;
};

export type PhenotypeCombination = {
    phenotypeString: string; // e.g., "Black-Red"
    phenotypes: { category: string; phenotype: string }[];
};

// Helper to get all unique phenotypes for a given category
function getPhenotypesForCategory(species: string, category: string): string[] {
    const speciesData = structuredGeneData[species];
    if (!speciesData) return [];

    const categoryData = speciesData[category];
    if (!categoryData || typeof categoryData !== 'object' || !Array.isArray(categoryData)) {
        return [];
    }

    // Use a Set to get unique phenotype strings
    const phenotypeSet = new Set(categoryData.map((gene) => gene.phenotype));
    return Array.from(phenotypeSet);
}

// Main function to generate combinations using Cartesian product
export function generatePhenotypeCombinations(
    species: string,
    targetGenes: TargetGene[]
): PhenotypeCombination[] {
    if (!targetGenes || targetGenes.length === 0) {
        return [];
    }

    const genePhenotypes: string[][] = targetGenes.map((gene) =>
        getPhenotypesForCategory(species, gene.category)
    );

    const cartesian = <T>(...a: T[][]): T[][] =>
        a.reduce((acc, x) => acc.flatMap((y) => x.map((z) => [...y, z])), [[]] as T[][]);

    const combinations = cartesian(...genePhenotypes);

    return combinations.map((combo) => {
        const phenotypeString = combo.join('-');
        const phenotypes = combo.map((phenotype, index) => ({
            category: targetGenes[index].category,
            phenotype,
        }));
        return { phenotypeString, phenotypes };
    });
}
