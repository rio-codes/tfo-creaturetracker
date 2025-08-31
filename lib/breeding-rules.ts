import type {
    EnrichedCreature,
    DbCreature,
    DbResearchGoal,
    DbBreedingPair,
    DbBreedingLogEntry,
} from "@/types";
import { enrichAndSerializeCreature } from "@/lib/serialization";
import { enrichAndSerializeGoal } from "./enrichAndSerializeGoal";
const INCOMPATIBLE_SPECIES = new Set(["Imsanga Afero"]);

const COMPATIBLE_PAIRS = new Set([
    ["Glacia Alsalto", "Silenta Spuristo"].sort().join("|"),
    ["Klara Alsalto", "Silenta Spuristo"].sort().join("|"),
    ["Transira Alsalto", "Silenta Spuristo"].sort().join("|"),
    ["Avka Felo", "Muska Felo"].sort().join("|"),
    ["Luna Hundo", "Suna Hundo"].sort().join("|"),
    ["Furioza Vizago", "Lanuga Vizago"].sort().join("|"),
    ["Frida Fisisto", "Terura Fisisto"].sort().join("|"),
    ["Rida Frakaso", "Osta Frakaso"].sort().join("|"),
    ["Songa Kreinto", "Inkuba Brulajo"].sort().join("|"),
    ["Kosmira Girafo", "Tera Girafo"].sort().join("|"),
]);

const HYBRID_PAIRS = new Map<string, string>([
    [["Glacia Alsalto", "Klara Alsalto"].sort().join("|"), "Transira Alsalto"],
    [["Ranbleko", "Glubleko"].sort().join("|"), "Tonbleko"],
    [["Nokta Voko", "Tagluma Valso"].sort().join("|"), "Kora Voko"],
]);

export function validatePairing(
    creatureA: EnrichedCreature,
    creatureB: EnrichedCreature
): { isValid: boolean; error?: string } {

    if (
        creatureA?.species === "Imsanga Afero" ||
        creatureB?.species === "Imsanga Afero"
    ) {
        return { isValid: false, error: "Imsanga Afero cannot breed." };
    }

    if (creatureA?.species === creatureB?.species) {
        return { isValid: true };
    }

    const sortedPairString = [creatureA?.species, creatureB?.species]
        .sort()
        .join("|");

    if (
        COMPATIBLE_PAIRS.has(sortedPairString) ||
        HYBRID_PAIRS.has(sortedPairString)
    ) {
        return { isValid: true };
    }

    return {
        isValid: false,
        error: `${creatureA?.species} and ${creatureB?.species} cannot be paired together.`,
    };
}

export function getHybridOffspring(
    speciesA: string,
    speciesB: string
): string | null {
    if (speciesA === speciesB) return null;
    const sortedPairString = [speciesA, speciesB].sort().join("|");
    return HYBRID_PAIRS.get(sortedPairString) || null;
}

export function checkGoalAchieved(
    progeny: DbCreature,
    goal: DbResearchGoal
): boolean {
    if (progeny.species !== goal.species) {
        return false;
    }

    const enrichedProgeny = enrichAndSerializeCreature(progeny);
    const enrichedGoal = enrichAndSerializeGoal(goal, goal.goalMode);

    if (!enrichedProgeny || !enrichedGoal) return false;

    const progenyGenes = new Map(enrichedProgeny.geneData.map(g => [g.category, g]));

    for (const [category, targetGene] of Object.entries(enrichedGoal.genes)) {
        if (category === "Gender") continue;

        const progenyGene = progenyGenes.get(category);
        if (!progenyGene) {
            return false; // Progeny is missing a required gene category
        }

        if (enrichedGoal.goalMode === 'genotype') {
            if (progenyGene.genotype !== targetGene.genotype) {
                return false;
            }
        } else { // phenotype mode
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
    allCreatures: EnrichedCreature[],
    allPairs: any[]
): EnrichedCreature[] {
    const pairedCreatureIds = new Set(
        allPairs.flatMap((p) => [p.maleParent.id, p.femaleParent.id])
    );
    console.log(pairedCreatureIds);

    return allCreatures.filter((potentialMate) => {
        if (potentialMate?.id === baseCreature?.id) {
            console.log(
                "Mate ",
                potentialMate?.creatureName,
                " has same id as base creature"
            );
            return false;
        }
        if (potentialMate?.gender === baseCreature?.gender) {
            console.log("Mate ", potentialMate?.creatureName, " is same gender");
            return false;
        }
        if (potentialMate?.growthLevel !== 3) {
            console.log(
                "Mate ",
                potentialMate?.creatureName,
                " is not an adult"
            );
            return false;
        }
        if (
            pairedCreatureIds.has(potentialMate?.id) &&
            pairedCreatureIds.has(baseCreature?.id)
        ) {
            console.log(
                "Mate ",
                potentialMate?.creatureName,
                " is already paired with ",
                baseCreature?.creatureName
            );
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
