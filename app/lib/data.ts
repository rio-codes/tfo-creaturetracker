import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { auth } from '@/auth';
import { eq, desc } from 'drizzle-orm';
import type { Creature } from '@/types';

/**
 * Fetches all creatures owned by the currently authenticated user.
 * @returns {Promise<Creature[]>} An array of the user's creatures.
 */
export async function getCreaturesForUser(): Promise<Creature[]> {
    const session = await auth();
    console.log(session)
    const userId = session?.user?.id;

    if (!userId) {
    return [];
    }

    try {
        // Using the more explicit db.select().from() syntax
        const userCreatures = await db
            .select()
            .from(creatures)
            .where(eq(creatures.userId, userId))
            .orderBy(desc(creatures.createdAt));

        return userCreatures as Creature[];
    } catch (error) {
        console.error("Database Error: Failed to fetch creatures.", error);
        return [];
    }
}