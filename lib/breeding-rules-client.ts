import type { EnrichedCreature } from '@/types';
import { speciesList as allSpecies } from '@/constants/creature-data';

export const speciesList = allSpecies;

export const breedingRules = {
    // Species that cannot breed with anything, including their own kind.
    incompatible: new Set<string>(['Imsanga Afero']),

    // Pairs of different species that can breed but do not produce a hybrid.
    // The offspring can be of either parent's species.
    compatible: new Set<string>([
        ['Glacia Alsalto', 'Silenta Spuristo'].sort().join('|'),
        ['Klara Alsalto', 'Silenta Spuristo'].sort().join('|'),
        ['Transira Alsalto', 'Silenta Spuristo'].sort().join('|'),
        ['Avka Felo', 'Muska Felo'].sort().join('|'),
        ['Luna Hundo', 'Suna Hundo'].sort().join('|'),
        ['Furioza Vizago', 'Lanuga Vizago'].sort().join('|'),
        ['Frida Fisisto', 'Terura Fisisto'].sort().join('|'),
        ['Rida Frakaso', 'Osta Frakaso'].sort().join('|'),
        ['Songa Kreinto', 'Inkuba Brulajo'].sort().join('|'),
        ['Kosmira Girafo', 'Tera Girafo'].sort().join('|'),
        // Back-crosses are compatible and can produce offspring of either parent species.
        ['Kora Voko', 'Nokta Voko'].sort().join('|'),
        ['Kora Voko', 'Tagluma Valso'].sort().join('|'),
        ['Transira Alsalto', 'Klara Alsalto'].sort().join('|'),
        ['Transira Alsalto', 'Glacia Alsalto'].sort().join('|'),
        ['Tonbleko', 'Ranbleko'].sort().join('|'),
        ['Tonbleko', 'Glubleko'].sort().join('|'),
    ]),

    // Pairs of different species that produce a specific hybrid offspring.
    hybrids: new Map<string, string>([
        [['Glacia Alsalto', 'Klara Alsalto'].sort().join('|'), 'Transira Alsalto'],
        [['Ranbleko', 'Glubleko'].sort().join('|'), 'Tonbleko'],
        [['Nokta Voko', 'Tagluma Valso'].sort().join('|'), 'Kora Voko'],
    ]),

    // Specific pairings that are explicitly disallowed.
    exceptions: new Set<string>([]),
};

export function getPossibleOffspringSpecies(speciesA: string, speciesB: string): string[] {
    if (speciesA === speciesB) {
        return [speciesA];
    }
    const sortedPairString = [speciesA, speciesB].sort().join('|');

    const hybridOffspring = breedingRules.hybrids.get(sortedPairString);
    if (hybridOffspring) {
        return [hybridOffspring];
    }

    if (breedingRules.compatible.has(sortedPairString)) {
        return [speciesA, speciesB];
    }

    return []; // Incompatible
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

    if (breedingRules.incompatible.has(speciesA) || breedingRules.incompatible.has(speciesB)) {
        return { isValid: false, error: `${speciesA} cannot breed.` };
    }

    const sortedPairString = [speciesA, speciesB].sort().join('|');
    if (breedingRules.exceptions.has(sortedPairString)) {
        return {
            isValid: false,
            error: ` and  cannot be paired together.`,
        };
    }

    if (speciesA === speciesB) {
        return { isValid: true };
    }

    if (
        breedingRules.compatible.has(sortedPairString) ||
        breedingRules.hybrids.has(sortedPairString)
    ) {
        return { isValid: true };
    }

    return {
        isValid: false,
        error: ` and  cannot be paired together.`,
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
