import type { creatures, researchGoals, breedingPairs, breedingLogEntries } from "@/src/db/schema";
import type { InferSelectModel } from "drizzle-orm";

// ============================================================================
// === DATABASE TYPES =========================================================
// ============================================================================
// These types represent the raw data shape directly from the database schema.
// They include Date objects and raw genetics strings.

export type DbCreature = InferSelectModel<typeof creatures>;
export type DbResearchGoal = InferSelectModel<typeof researchGoals>;
export type DbBreedingPair = InferSelectModel<typeof breedingPairs>;
export type DbBreedingLogEntry = InferSelectModel<typeof breedingLogEntries>;


// ============================================================================
// === ENRICHED & SERIALIZED TYPES ============================================
// ============================================================================
// These types represent the final, "client-safe" data shape after it has been
// processed by your data-fetching functions. Dates are strings, and genetics
// strings are parsed into structured objects.

export type EnrichedCreature =
    | (Omit<DbCreature, "genetics" | "gottenAt" | "createdAt" | "updatedAt"> & {
            geneData:
                | {
                        category: string;
                        genotype: string;
                        phenotype: string;
                    }[]
                | null;
            gottenAt: string | null;
            createdAt: string;
            updatedAt: string;
        })
    | null;

export type EnrichedResearchGoal =
    | (Omit<DbResearchGoal, "genes" | "createdAt" | "updatedAt"> & {
            genes: {
                [key: string]: {
                    genotype: string;
                    phenotype: string;
                    isMultiGenotype: boolean;
                };
            };
            createdAt: string;
            updatedAt: string;
            isAchieved?: boolean;
        })
    | null;

export type EnrichedBreedingPair =
    | (Omit<
            DbBreedingPair,
            "createdAt" | "updatedAt" | "maleParent" | "femaleParent"
        > & {
            maleParent: EnrichedCreature;
            femaleParent: EnrichedCreature;
            assignedGoals: EnrichedResearchGoal[];
            timesBred: number;
            progenyCount: number;
            isInbred: boolean;
            progeny: EnrichedCreature[];
            createdAt: string;
            updatedAt: string;
        })
    | null;

export type Prediction = {
    goalId: string;
    goalName: string;
    pairId: string;
    pairName: string;
    maleParent: EnrichedCreature;
    femaleParent: EnrichedCreature;
    chancesByCategory: { [key: string]: number };
    averageChance: number;
    isPossible: boolean;
};
