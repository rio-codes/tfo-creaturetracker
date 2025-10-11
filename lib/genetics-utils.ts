import { structuredGeneData, speciesGenes, RawSpeciesGenes } from '@/constants/creature-data';

export function getPhenotypeForGenotype(
    species: string,
    category: string,
    genotype: string,
    gender?: 'Male' | 'Female'
): string {
    const categoryGeneData = structuredGeneData[species]?.[category];
    if (!categoryGeneData || !Array.isArray(categoryGeneData)) {
        return 'Unknown';
    }

    const speciesGeneInfo = (speciesGenes as RawSpeciesGenes)[species];
    const isDimorphic: boolean = speciesGeneInfo?.Dimorphic === 'True';

    const directMatch = categoryGeneData.find((g) => {
        const genotypeMatch = g.genotype === genotype;
        if (!isDimorphic || category === 'Gender' || !gender) {
            return genotypeMatch;
        }
        // Ensure g.gender exists before comparing, as it might be undefined for non-dimorphic genes
        return genotypeMatch && (g.gender === undefined || g.gender === gender);
    });

    if (directMatch) {
        return directMatch.phenotype;
    }
    return 'Unknown';
}
