import 'server-only';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { auth } from '@/auth';
import { eq, desc, count } from 'drizzle-orm';
import type { Creature } from '@/types';

const ITEMS_PER_PAGE = 12; 

export async function fetchFilteredCreatures(
    currentPage: number,
    ) {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
        throw new Error('User is not authenticated.');
        }

        const offset = (currentPage - 1) * ITEMS_PER_PAGE;

        try {
            // Get the creatures for the current page
            const paginatedCreatures = await db.query.creatures.findMany({
                where: eq(creatures.userId, userId),
                orderBy: [desc(creatures.createdAt)],
                limit: ITEMS_PER_PAGE,
                offset: offset,
            });

            // Get the total count of creatures for this user
            const totalCountResult = await db.select({
                count: count()
            }).from(creatures).where(eq(creatures.userId, userId));
    
            const totalCreatures = totalCountResult[0]?.count ?? 0;
            const totalPages = Math.ceil(totalCreatures / ITEMS_PER_PAGE);

            return {
                creatures: paginatedCreatures as Creature[],
                totalPages: totalPages
                };
        } catch (error) {
            console.error("Database Error: Failed to fetch creatures.", error);
            // Return a safe fallback value in case of an error
            return {
                creatures: [],
                totalPages: 0,
            };
        }
}