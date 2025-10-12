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
    role: 'admin' | 'user';
    status: 'active' | 'suspended';
    theme: 'light' | 'dark' | 'system';
    bio?: string | null;
    supporterTier?: string | null;
    featuredCreatureIds?: string[] | null;
    featuredGoalIds?: string[] | null;
    pronouns?: string | null;
    socialLinks?: string[] | null;
    showLabLink: boolean;
    statusMessage?: string | null;
    statusEmoji?: string | null;
    showStats: boolean;
    showFriendsList: boolean;
    preserveFilters: boolean;
};

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
      })
    | null;

export type GoalGene = {
    gender: 'Male' | 'Female' | undefined;
    genotype: string;
    phenotype: string;
    isMultiGenotype: boolean;
    isOptional: boolean;
};

export type EnrichedResearchGoal = Omit<DbResearchGoal, 'createdAt' | 'updatedAt' | 'genes'> & {
    createdAt: string;
    updatedAt: string;
    genes: {
        [category: string]: GoalGene;
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
