import type { EnrichedCreature, OffspringOutcome } from '@/types';
import { hybridizationRules } from '@/lib/hybridization-rules';

const compatibility: Record<string, string[]> = {
    'Tagluma Valso': ['Nokta Voko', 'Kora Voko'],
    'Nokta Voko': ['Tagluma Valso', 'Kora Voko'],
    'Kora Voko': ['Tagluma Valso', 'Nokta Voko'],
    'Tera Girafo': ['Kosmira Girafo'],
    'Kosmira Girafo': ['Tera Girafo'],
    'Klara Alsalto': ['Glacia Alsalto', 'Transira Alsalto', 'Silenta Spuristo'],
    'Transira Alsalto': ['Klara Alsalto', 'Glacia Alsalto', 'Silenta Spuristo'],
    'Glacia Alsalto': ['Klara Alsalto', 'Transira Alsalto', 'Silenta Spuristo'],
    'Silenta Spuristo': ['Klara Alsalto', 'Glacia Alsalto', 'Transira Alsalto'],
    'Tonbleko': ['Ranbleko', 'Glubleko'],
    'Ranbleko': ['Tonbleko', 'Glubleko'],
    'Glubleko': ['Tonbleko', 'Ranbleko'],
    'Osta Frakaso': ['Rida Frakaso'],
    'Rida Frakaso': ['Osta Frakaso'],
    'Norda Duko': ['Sabla Rego'],
    'Sabla Rego': ['Norda Duko'],
};

export function isPairCompatible(speciesA: string, speciesB: string): boolean {
    if (speciesA === speciesB) return true;
    // Check for compatibility in both directions
    const compatibleMatesA = compatibility[speciesA];
    const compatibleMatesB = compatibility[speciesB];
    return compatibleMatesA?.includes(speciesB) || compatibleMatesB?.includes(speciesA) || false;
}

export function getPossibleOffspringSpecies(
    maleSpecies: string,
    femaleSpecies: string
): OffspringOutcome[] {
    if (!maleSpecies || !femaleSpecies) return [];

    if (maleSpecies === femaleSpecies) {
        return [
            {
                species: maleSpecies,
                probability: 1,
                geneOutcomes: {},
            },
        ];
    }

    const rule =
        hybridizationRules[maleSpecies]?.[femaleSpecies] ||
        hybridizationRules[femaleSpecies]?.[maleSpecies];

    if (rule) {
        return rule.outcomes.map((o) => ({
            ...o,
            geneOutcomes: {},
        }));
    }

    if (isPairCompatible(maleSpecies, femaleSpecies)) {
        return [
            {
                species: maleSpecies,
                probability: 0.5,
                geneOutcomes: {},
            },
            {
                species: femaleSpecies,
                probability: 0.5,
                geneOutcomes: {},
            },
        ];
    }

    return [];
}
export function validatePairing(
    creatureA: { species?: string | null } | null,
    creatureB: { species?: string | null } | null
): { isValid: boolean; error?: string } {
    const speciesA = creatureA?.species?.trim();
    const speciesB = creatureB?.species?.trim();

    if (!speciesA || !speciesB) {
        return { isValid: false, error: 'Parent species is missing.' };
    }

    if (isPairCompatible(speciesA, speciesB)) {
        return { isValid: true };
    }

    return {
        isValid: false,
        error: `${speciesA} and ${speciesB} cannot be paired together.`,
    };
}

export function findSuitableMates(
    baseCreature: EnrichedCreature,
    allCreatures: EnrichedCreature[]
): EnrichedCreature[] {
    return allCreatures.filter((potentialMate) => {
        if (potentialMate?.id === baseCreature?.id) {
            return false;
        }
        if (potentialMate?.gender === baseCreature?.gender) {
            return false;
        }
        if (potentialMate?.growthLevel !== 3) {
            return false;
        }

        const { isValid } = validatePairing(baseCreature, potentialMate);
        return isValid;
    });
}
