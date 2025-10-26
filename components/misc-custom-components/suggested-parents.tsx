import React from 'react';
import { structuredGeneData } from '@/constants/creature-data';
import type { GoalGene } from '@/types';
import { Badge } from '@/components/ui/badge';

type SuggestedParentsProps = {
    species: string;
    category: string;
    targetGene: GoalGene;
};

type ParentPairSuggestion = {
    parentAPhenotype: string;
    parentAGenotype: string;
    parentBPhenotype: string;
    parentBGenotype: string;
    probability: number;
};

function parseGenotypeToLoci(genotype: string): string[] {
    return genotype.match(/.{1,2}/g) || [];
}

function getPunnettSquare(p1Locus: string, p2Locus: string): string[] {
    const outcomes: string[] = [];
    const p1Alleles = [p1Locus[0], p1Locus[1]];
    const p2Alleles = [p2Locus[0], p2Locus[1]];

    for (const a1 of p1Alleles) {
        for (const a2 of p2Alleles) {
            const outcome = [a1, a2].sort().join('');
            outcomes.push(outcome);
        }
    }
    return outcomes;
}

function calculatePairProbability(
    parentAGenotype: string,
    parentBGenotype: string,
    targetGenotype: string
): number {
    const parentALoci = parseGenotypeToLoci(parentAGenotype);
    const parentBLoci = parseGenotypeToLoci(parentBGenotype);
    const targetLoci = parseGenotypeToLoci(targetGenotype);

    // If genotypes have different numbers of loci, they are incompatible.
    if (parentALoci.length !== targetLoci.length || parentBLoci.length !== targetLoci.length) {
        return 0;
    }

    let combinedProbability = 1;

    for (let i = 0; i < targetLoci.length; i++) {
        const targetLocus = [targetLoci[i][0], targetLoci[i][1]].sort().join('');
        const outcomes = getPunnettSquare(parentALoci[i], parentBLoci[i]);
        const successfulOutcomes = outcomes.filter((o) => o === targetLocus).length;
        const locusProbability = successfulOutcomes / 4;

        // If any locus has a 0% chance, the total probability is 0.
        if (locusProbability === 0) {
            return 0;
        }
        combinedProbability *= locusProbability;
    }

    return combinedProbability;
}

export function SuggestedParents({ species, category, targetGene }: SuggestedParentsProps) {
    const suggestions: ParentPairSuggestion[] = React.useMemo(() => {
        const speciesGeneInfo = structuredGeneData[species];
        if (!speciesGeneInfo) return [];

        const categoryGenes = speciesGeneInfo[category];
        if (!Array.isArray(categoryGenes)) return [];

        const targetGenotype = parseGenotypeToLoci(targetGene.genotype)
            .map((locus) => [locus[0], locus[1]].sort().join(''))
            .join('');
        const pairSuggestions = new Map<string, ParentPairSuggestion>();

        for (const parentA of categoryGenes) {
            for (const parentB of categoryGenes) {
                const probability = calculatePairProbability(
                    parentA.genotype,
                    parentB.genotype,
                    targetGenotype
                );

                if (probability > 0) {
                    const pairKey = [parentA.phenotype, parentB.phenotype].sort().join(' x ');
                    const existing = pairSuggestions.get(pairKey);

                    if (!existing || probability > existing.probability) {
                        pairSuggestions.set(pairKey, {
                            parentAPhenotype: parentA.phenotype,
                            parentAGenotype: parentA.genotype,
                            parentBPhenotype: parentB.phenotype,
                            parentBGenotype: parentB.genotype,
                            probability,
                        });
                    }
                }
            }
        }

        return Array.from(pairSuggestions.values()).sort((a, b) => b.probability - a.probability);
    }, [species, category, targetGene]);

    const getProbabilityBadge = (probability: number) => {
        if (probability === 1) {
            return <Badge className="bg-green-500 hover:bg-green-500 text-white">100%</Badge>;
        }
        if (probability >= 0.75) {
            return <Badge className="bg-lime-500 hover:bg-lime-500 text-white">75%</Badge>;
        }
        if (probability >= 0.5) {
            return <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white">50%</Badge>;
        }
        return <Badge className="bg-orange-500 hover:bg-orange-500 text-white">25%</Badge>;
    };

    if (suggestions.length === 0) {
        return <p className="text-sm italic">No parent suggestions available for this trait.</p>;
    }

    return (
        <div className="space-y-2">
            <p className="text-sm text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                Best parent trait combinations to produce the target <strong>{category}</strong>{' '}
                gene ({targetGene.phenotype} - {targetGene.genotype}).
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {suggestions.slice(0, 12).map((s, i) => (
                    <li
                        key={`${s.parentAGenotype}-${s.parentBGenotype}-${i}`}
                        className="flex items-center justify-between p-2 rounded-md bg-black/5 dark:bg-white/5"
                    >
                        <span className="font-medium">
                            {s.parentAPhenotype} ({s.parentAGenotype}) x {s.parentBPhenotype} (
                            {s.parentBGenotype})
                        </span>
                        {getProbabilityBadge(s.probability)}
                    </li>
                ))}
            </ul>
        </div>
    );
}
