import type { InferSelectModel } from 'drizzle-orm';
import type { creatures } from '@/src/db/schema';

export type Creature = InferSelectModel<typeof creatures>;