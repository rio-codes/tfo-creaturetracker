import { Creature } from "@/types"
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
    creatureA: Creature,
    creatureB: Creature
): { isValid: boolean; error?: string } {
    const speciesA = creatureA.species;
    const speciesB = creatureB.species;

    if (
        INCOMPATIBLE_SPECIES.has(speciesA) ||
        INCOMPATIBLE_SPECIES.has(speciesB)
    ) {
        return { isValid: false, error: "Imsanga Afero cannot breed." };
    }

    if (speciesA === speciesB) {
        return { isValid: true };
    }

    const sortedPairString = [speciesA, speciesB].sort().join("|");

    if (
        COMPATIBLE_PAIRS.has(sortedPairString) ||
        HYBRID_PAIRS.has(sortedPairString)
    ) {
        return { isValid: true };
    }

    return {
        isValid: false,
        error: `${speciesA} and ${speciesB} cannot be paired together.`,
    };
}

export function findSuitableMates(
    baseCreature: Creature,
    allCreatures: Creature[],
    allPairs: any[]
): Creature[] {
    const pairedCreatureIds = new Set(
        allPairs.flatMap((p) => [p.maleParent.id, p.femaleParent.id])
    );
    console.log(pairedCreatureIds)

    return allCreatures.filter((potentialMate) => {
        if (potentialMate.id === baseCreature.id) {
            console.log("Mate ", potentialMate.creatureName, " has same id as base creature");
            return false;
        }
        if (potentialMate.gender === baseCreature.gender) {
            console.log("Mate ", potentialMate.creatureName, " is same gender");
            return false;
            }
        if (potentialMate.growthLevel !== 3) {
            console.log("Mate ", potentialMate.creatureName, " is not an adult");
            return false;
        };
        if (pairedCreatureIds.has(potentialMate.id) && pairedCreatureIds.has(baseCreature.id)) {
            console.log("Mate ", potentialMate.creatureName, " is already paired with ", baseCreature.creatureName);
            return false;
        }

        const { isValid } = validatePairing(baseCreature, potentialMate);
        return isValid;
    });
}
