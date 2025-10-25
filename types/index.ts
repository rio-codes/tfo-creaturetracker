import type {
    users,
    creatures,
    breedingPairs,
    breedingLogEntries,
    researchGoals,
    achievedGoals,
} from '@/src/db/schema';

export type DbUser = typeof users.$inferSelect;
export type DbCreature = typeof creatures.$inferSelect;
export type DbBreedingPair = typeof breedingPairs.$inferSelect;
export type DbBreedingLogEntry = typeof breedingLogEntries.$inferSelect;
export type DbResearchGoal = typeof researchGoals.$inferSelect;
export type DbAchievedGoal = typeof achievedGoals.$inferSelect;

export type EnrichedCreature =
    | (Omit<DbCreature, 'createdAt' | 'updatedAt' | 'gottenAt'> & {
          createdAt: string;
          updatedAt: string;
          gottenAt: string | null;
          geneData: {
              category: string;
              genotype: string;
              phenotype: string;
          }[];
          generation: number | null;
          origin: string | null;
          progeny: EnrichedCreature[];
      })
    | null;

export type User = Omit<DbUser, 'createdAt' | 'updatedAt'> & {
    createdAt: string | Date;
    updatedAt: string | Date;
    flair: {
        flairId: string;
        imageUrl: string;
        name: string;
    } | null;
    allowWishlistGoalSaving?: boolean;
};

export type CreatureKey = {
    userId: string;
    code: string;
};

export type GoalGene = {
    genotype: string;
    phenotype: string;
    isMultiGenotype: boolean;
    isOptional: boolean;
};

export type EnrichedResearchGoal = Omit<DbResearchGoal, 'createdAt' | 'updatedAt'> & {
    imageUrl?: string | null;
    genes: { [category: string]: GoalGene };
    excludedGenes?: { [category: string]: { phenotype: string[] } } | null;
    assignedPairIds?: string[] | null;
    targetGeneration?: number | null;
    createdAt: string;
    updatedAt: string;
    user?:
        | DbUser
        | {
              username: string | null;
              allowWishlistGoalSaving: boolean;
          };
};

export type EnrichedBreedingPair = Omit<DbBreedingPair, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
    timesBred: number;
    progenyCount: number;
    progeny: EnrichedCreature[];
    isInbred: boolean;
    logs: SerializedBreedingLogEntry[];
    maleParent: EnrichedCreature;
    femaleParent: EnrichedCreature;
    assignedGoals: (EnrichedResearchGoal & {
        isAchieved: boolean;
        isPossible: boolean;
        averageChance: number;
    })[];
};

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

export type SerializedBreedingLogEntry = Omit<DbBreedingLogEntry, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};
