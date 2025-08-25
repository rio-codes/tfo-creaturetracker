import { EnrichedCreature } from "@/types"
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
