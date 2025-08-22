import type { InferSelectModel } from 'drizzle-orm';
import type { users, creatures, researchGoals } from '@/src/db/schema';

export type Creature = InferSelectModel<typeof creatures>;
export type ResearchGoal = InferSelectModel<typeof researchGoals>;
export type User = InferSelectModel<typeof users>
export type GoalMode = typeof users.$inferSelect.goalMode;

export type BreedingPairWithDetails = {
    id: string;
    isPinned: boolean;
    pairName: string;
    species: string;
    maleParent: Creature;
    femaleParent: Creature;
    assignedGoals: ResearchGoal[];
};
