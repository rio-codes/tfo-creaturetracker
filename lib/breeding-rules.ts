import type {
    EnrichedCreature,
    DbCreature,
    DbResearchGoal,
    DbBreedingPair,
    DbBreedingLogEntry,
} from '@/types';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/client-serialization';
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
            error: `${speciesA} and ${speciesB} cannot be paired together.`,
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
        error: `${speciesA} and ${speciesB} cannot be paired together.`,
    };
}

export function checkGoalAchieved(progeny: DbCreature, goal: DbResearchGoal): boolean {
    if (progeny.species !== goal.species) {
        return false;
    }

    const enrichedProgeny = enrichAndSerializeCreature(progeny);
    const enrichedGoal = enrichAndSerializeGoal(goal, goal.goalMode);

    if (!enrichedProgeny || !enrichedGoal) return false;

    const progenyGenes = new Map(enrichedProgeny.geneData.map((g) => [g.category, g]));

    for (const [category, targetGene] of Object.entries(enrichedGoal.genes)) {
        if (category === 'Gender') continue;

        const progenyGene = progenyGenes.get(category);
        if (!progenyGene) {
            return false; // Progeny is missing a required gene category
        }

        if (enrichedGoal.goalMode === 'genotype') {
            if (progenyGene.genotype !== targetGene.genotype) {
                return false;
            }
        } else {
            // phenotype mode
            if (progenyGene.phenotype !== targetGene.phenotype) {
                return false;
            }
        }
    }

    return true;
}

// Recursive function to get ancestors up to a certain depth
function getAncestorsRecursive(
    creatureId: string,
    allLogs: DbBreedingLogEntry[],
    allPairs: DbBreedingPair[],
    depth: number,
    ancestors: Set<string>
) {
    if (depth <= 0 || !creatureId) {
        return;
    }

    const logEntry = allLogs.find(
        (log) => log.progeny1Id === creatureId || log.progeny2Id === creatureId
    );

    if (!logEntry) {
        return;
    }

    const pair = allPairs.find((p) => p.id === logEntry.pairId);
    if (!pair) {
        return;
    }

    const { maleParentId, femaleParentId } = pair;
    if (maleParentId) ancestors.add(maleParentId);
    if (femaleParentId) ancestors.add(femaleParentId);

    getAncestorsRecursive(maleParentId, allLogs, allPairs, depth - 1, ancestors);
    getAncestorsRecursive(femaleParentId, allLogs, allPairs, depth - 1, ancestors);
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

export function checkForInbreeding(
    maleId: string,
    femaleId: string,
    allLogs: DbBreedingLogEntry[],
    allPairs: DbBreedingPair[]
): boolean {
    if (!maleId || !femaleId) {
        return false;
    }

    // Check for direct parent/child or other ancestor relationship
    const maleAncestors = new Set<string>();
    getAncestorsRecursive(maleId, allLogs, allPairs, 5, maleAncestors);
    if (maleAncestors.has(femaleId)) return true;

    const femaleAncestors = new Set<string>();
    getAncestorsRecursive(femaleId, allLogs, allPairs, 5, femaleAncestors);
    if (femaleAncestors.has(maleId)) return true;

    // Check for shared ancestors (siblings, cousins, etc.)
    for (const ancestor of maleAncestors) {
        if (femaleAncestors.has(ancestor)) return true;
    }

    return false;
}
