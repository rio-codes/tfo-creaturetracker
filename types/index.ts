import type { InferSelectModel } from "drizzle-orm";

/**
 * Represents a user of the application.
 */
export type User = {
    id: string;
    name?: string | null;
    email: string;
    emailVerified?: Date | null;
    image?: string | null;
    username: string;
    tfoUsername: string;
    collectionItemsPerPage: number;
    goalsItemsPerPage: number;
    pairsItemsPerPage: number;
    createdAt: Date;
    updatedAt: Date;
    role: "admin" | "user";
    status: "active" | "suspended";
    theme: "light" | "dark";
};

/**
 * Represents the raw creature object as it is stored in the database.
 */
export type DbCreature = {
    id: string;
    userId: string;
    code: string;
    creatureName: string | null;
    species: string;
    imageUrl: string;
    gender: "male" | "female";
    growthLevel: number;
    genetics: string;
    isPinned: boolean;
    gottenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Represents a creature after it has been enriched with serialized dates
 * and detailed gene information. This is the object used in client components.
 */
export type EnrichedCreature =
    | (Omit<DbCreature, "createdAt" | "updatedAt" | "gottenAt"> & {
          createdAt: string;
          updatedAt: string;
          gottenAt: string | null;
          geneData: {
              category: string;
              genotype: string;
              phenotype: string;
          }[];
      })
    | null;

/**
 * Represents the detailed information for a single selected gene in a research goal.
 */
export type GoalGene = {
    genotype: string;
    phenotype: string;
    isMultiGenotype: boolean;
    isOptional: boolean;
};

/**
 * Represents the raw research goal object as it is stored in the database.
 */
export type DbResearchGoal = {
    id: string;
    userId: string;
    name: string;
    species: string;
    imageUrl: string | null; // The 'genes' column is JSONB
    genes: InferSelectModel<
        typeof import("../src/db/schema").researchGoals
    >["genes"];
    goalMode: "genotype" | "phenotype";
    isPinned: boolean;
    assignedPairIds: string[] | null;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Represents a research goal after it has been enriched with serialized dates
 * and detailed gene information. This is the object used in client components.
 */
export type EnrichedResearchGoal = Omit<
    DbResearchGoal,
    "createdAt" | "updatedAt" | "genes"
> & {
    createdAt: string;
    updatedAt: string;
    genes: {
        [category: string]: GoalGene;
    };
};

/**
 * Represents the raw breeding pair object as it is stored in the database.
 */
export type DbBreedingPair = {
    id: string;
    userId: string;
    pairName: string;
    species: string;
    maleParentId: string;
    femaleParentId: string;
    isPinned: boolean;
    assignedGoalIds: string[] | null;
    outcomesPreviewUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Represents a breeding pair after it has been enriched with full parent and progeny data.
 */
export type EnrichedBreedingPair = Omit<
    DbBreedingPair,
    "createdAt" | "updatedAt"
> & {
    createdAt: string;
    updatedAt: string;
    timesBred: number;
    progenyCount: number;
    progeny: EnrichedCreature[];
    isInbred: boolean;
    maleParent: EnrichedCreature;
    femaleParent: EnrichedCreature;
    assignedGoals: (EnrichedResearchGoal & {
        isAchieved: boolean;
        isPossible: boolean;
        averageChance: number;
    })[];
};

/**
 * Represents a single breeding log entry from the database.
 */
export type DbBreedingLogEntry = {
    id: number;
    userId: string;
    pairId: string;
    progeny1Id: string | null;
    progeny2Id: string | null;
    notes: string | null;
    createdAt: Date;
};

/**
 * Represents the data structure for a breeding prediction against a goal.
 */
export type Prediction = {
    goalId: string;
    goalName: string;
    averageChance: number;
    isPossible: boolean;
    pairId?: string;
    pairName?: string;
    maleParent?: EnrichedCreature;
    femaleParent?: EnrichedCreature;
    chancesByCategory?: { [key: string]: number };
};
