import type { InferSelectModel } from 'drizzle-orm';
import type { users, creatures, researchGoals } from '@/src/db/schema';
import { fetchGoalDetailsAndPredictions } from '@/lib/data';

export type Creature = InferSelectModel<typeof creatures>;
export type ResearchGoal = InferSelectModel<typeof researchGoals>;
export type User = InferSelectModel<typeof users>
export type GoalMode = typeof users.$inferSelect.goalMode;

export type DetailedSerializedGoal = {
    createdAt: string;
    updatedAt: string;
    genes: {
        [key: string]: any;
    };
    id: string;
    name: string;
    userId: string;
    imageUrl: string | null;
    species: string;
    isPinned: boolean;
    assignedPairIds: string[] | null;
};

export type BreedingPairWithDetails = {
    id: string;
    isPinned: boolean;
    pairName: string;
    species: string;
    maleParent: Creature;
    femaleParent: Creature;
    assignedGoals: ResearchGoal[];
};

export type SerializedCreature = {
    createdAt: string;
    updatedAt: string;
    gottenAt: string | null;
    id: string;
    userId: string;
    gender: "male" | "female" | "genderless" | "unknown" | null;
    code: string;
    creatureName: string | null;
    imageUrl: string;
    growthLevel: number | null;
    isStunted: boolean | null;
    species: string | null;
    genetics: string | null;
    isPinned: boolean;
}

export type Prediction = {
    pairId: string;
    pairName: string;
    maleParent: Creature;
    femaleParent: Creature;
    chancesByCategory: { [key: string]: number };
    averageChance: number;
    isPossible: boolean;
};