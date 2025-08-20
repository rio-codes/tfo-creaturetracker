import type { InferSelectModel } from 'drizzle-orm';
import type { creatures, researchGoals } from '@/src/db/schema';

export type Creature = InferSelectModel<typeof creatures>;
export type ResearchGoal = InferSelectModel<typeof researchGoals>;

export type BreedingPairWithDetails = {
    id: string;
    pairName: string;
    species: string;
    maleParent: Creature;
    femaleParent: Creature;
    assignedGoals: ResearchGoal[];
};