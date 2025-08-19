import "server-only";
import { db } from "@/src/db";
import { creatures } from "@/src/db/schema";
import { auth } from "@/auth";
import { and, ilike, or, eq, desc, count, inArray } from "drizzle-orm";
import type { Creature } from "@/types";

const ITEMS_PER_PAGE = 12;

export async function getCreaturesForUser(
    currentPage: number,
    query?: string,
    genders?: string[],
    stage?: string,
    species?: string
) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("User is not authenticated.");
    }

    console.log("--- [Data Fetch] Received Parameters ---");
    console.log({ currentPage, query, genders, stage, species });
    console.log("--------------------------------------");

    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const stageToGrowthLevel: { [key: string]: number } = {
        capsule: 1,
        juvenile: 2,
        adult: 3,
    };
    const growthLevel = stage ? stageToGrowthLevel[stage] : undefined;

    const conditions = [
        eq(creatures.userId, userId),
        query
            ? or(
                  ilike(creatures.code, `%${query}%`),
                  ilike(creatures.creatureName, `%${query}%`)
              )
            : undefined,
        genders && genders.length > 0
            ? inArray(creatures.gender, genders as ("male" | "female")[])
            : undefined,
        growthLevel ? eq(creatures.growthLevel, growthLevel) : undefined,
        species && species !== "all"
            ? ilike(creatures.species, species)
            : undefined,
    ].filter(Boolean); // This safely removes any undefined conditions

    try {
        // Get the creatures for the current page
        const paginatedCreatures = await db
            .select()
            .from(creatures)
            .where(and(...conditions))
            .orderBy(desc(creatures.createdAt))
            .limit(ITEMS_PER_PAGE)
            .offset(offset);

        // Get the total count of creatures for this user
        const totalCountResult = await db
            .select({ count: count() })
            .from(creatures)
            .where(and(...conditions));

        const totalCreatures = totalCountResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalCreatures / ITEMS_PER_PAGE);

        return {
            creatures: paginatedCreatures as Creature[],
            totalPages: totalPages,
        };
    } catch (error) {
        console.error("Database Error: Failed to fetch creatures.", error);
        return {
            creatures: [],
            totalPages: 0,
        };
    }
}
