import "server-only";
import { db } from "@/src/db";
import { creatures, researchGoals } from "@/src/db/schema";
import { auth } from "@/auth";
import { and, ilike, or, eq, desc, count } from "drizzle-orm";
import type { Creature, ResearchGoal } from "@/types";

const ITEMS_PER_PAGE = 12;
const GOALS_PER_PAGE = 12;

export async function getCreaturesForUser(
    currentPage: number,
    query?: string,
    gender?: string,
    stage?: string,
    species?: string
) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("User is not authenticated.");
    }

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
        gender && gender !== "all" ? eq(creatures.gender, gender) : undefined,
        growthLevel ? eq(creatures.growthLevel, growthLevel) : undefined,
        species && species !== "all"
            ? ilike(creatures.species, species)
            : undefined,
    ].filter(Boolean);

    try {
        // Get the creatures for the current page
        const paginatedCreatures = await db
            .select()
            .from(creatures)
            .where(and(...conditions))
            .orderBy(desc(creatures.isPinned), desc(creatures.createdAt))
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

export async function fetchFilteredResearchGoals(
    currentPage: number,
    query?: string,
    species?: string
) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("User is not authenticated.");
    }

    const offset = (currentPage - 1) * GOALS_PER_PAGE;

    // Dynamically build our filter conditions array
    const conditions = [
        eq(researchGoals.userId, userId),
        query ? ilike(researchGoals.name, `%${query}%`) : undefined,
        species && species !== "all"
            ? eq(researchGoals.species, species)
            : undefined,
    ].filter(Boolean); // This removes any undefined (inactive) filters

    try {
        // Query for the paginated data
        const paginatedGoals = await db
            .select()
            .from(researchGoals)
            .where(and(...conditions))
            .orderBy(
                desc(researchGoals.isPinned),
                desc(researchGoals.createdAt)
            )
            .limit(GOALS_PER_PAGE)
            .offset(offset);

        // Query for the total count for pagination
        const totalCountResult = await db
            .select({ count: count() })
            .from(researchGoals)
            .where(and(...conditions));

        const totalGoals = totalCountResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalGoals / GOALS_PER_PAGE);

        return {
            goals: paginatedGoals as ResearchGoal[],
            totalPages: totalPages,
        };
    } catch (error) {
        console.error("Database Error: Failed to fetch research goals.", error);
        return { goals: [], totalPages: 0 };
    }
}
