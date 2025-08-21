import "server-only";
import { db } from "@/src/db";
import { creatures, researchGoals, breedingPairs } from "@/src/db/schema";
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

export async function fetchBreedingPairs(currentPage: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not authenticated.");

    const PAIRS_PER_PAGE = 10;
    const offset = (currentPage - 1) * PAIRS_PER_PAGE;

    try {
        const paginatedPairs = await db.query.breedingPairs.findMany({
            where: eq(breedingPairs.userId, userId),
            with: {
                maleParent: true,
                femaleParent: true,
            },
            orderBy: [
                desc(breedingPairs.isPinned),
                desc(breedingPairs.createdAt),
            ],
            limit: PAIRS_PER_PAGE,
            offset: offset,
        });

        const allGoals = await db.query.researchGoals.findMany({
            where: eq(researchGoals.userId, userId),
        });

        const pairsWithGoals = paginatedPairs.map((pair) => {
            const assignedGoals = allGoals.filter((goal) =>
                pair.assignedGoalIds?.includes(goal.id)
            );
            return { ...pair, assignedGoals };
        });

        const totalCountResult = await db
            .select({ count: count() })
            .from(breedingPairs)
            .where(eq(breedingPairs.userId, userId));
        const totalPages = Math.ceil(
            (totalCountResult[0]?.count ?? 0) / PAIRS_PER_PAGE
        );

        return { pairs: pairsWithGoals, totalPages };
    } catch (error) {
        console.error("Database Error: Failed to fetch breeding pairs.", error);
        return { pairs: [], totalPages: 0 };
    }
}

export async function getAllCreaturesForUser(): Promise<Creature[]> {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return []; // Return empty array if not logged in
    }

    try {
        const allUserCreatures = await db.query.creatures.findMany({
            where: eq(creatures.userId, userId),
            orderBy: [desc(creatures.createdAt)],
        });
        return allUserCreatures as Creature[];
    } catch (error) {
        console.error("Database Error: Failed to fetch all creatures.", error);
        return []; // Return empty array on error
    }
}

export async function getAllResearchGoalsForUser(): Promise<ResearchGoal[]> {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return [];
    }

    try {
        const allUserGoals = await db.query.researchGoals.findMany({
            where: eq(researchGoals.userId, userId),
            orderBy: [desc(researchGoals.createdAt)],
        });
        return allUserGoals as ResearchGoal[];
    } catch (error) {
        console.error("Database Error: Failed to fetch all research goals.", error);
        return [];
    }
}