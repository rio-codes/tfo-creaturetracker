import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import {
    breedingLogEntries,
    researchGoals,
    creatures,
    achievedGoals,
    breedingPairs,
} from "@/src/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { checkGoalAchieved } from "@/lib/breeding-rules";

const createLogSchema = z.object({
    pairId: z.string().uuid("Invalid pair ID"),
    progeny1Id: z.string().uuid("Invalid progeny ID").nullable().optional(),
    progeny2Id: z.string().uuid("Invalid progeny ID").nullable().optional(),
    notes: z
        .string()
        .max(500, "Notes cannot exceed 500 characters.")
        .optional(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = createLogSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json(
                { error: "Invalid input.", details: validated.error.flatten() },
                { status: 400 }
            );
        }
        const { pairId, progeny1Id, progeny2Id, notes } = validated.data;

        const [newLogEntry] = await db
            .insert(breedingLogEntries)
            .values({
                userId,
                pairId,
                progeny1Id: progeny1Id || null,
                progeny2Id: progeny2Id || null,
                notes,
                createdAt: new Date(),
            })
            .returning();

        // --- Check for achieved goals ---
        const progenyIds = [progeny1Id, progeny2Id].filter(
            (id): id is string => !!id
        );

        if (progenyIds.length > 0) {
            const pair = await db.query.breedingPairs.findFirst({
                where: and(
                    eq(breedingPairs.id, pairId),
                    eq(breedingPairs.userId, userId)
                ),
            });

            if (
                pair &&
                pair.assignedGoalIds &&
                pair.assignedGoalIds.length > 0
            ) {
                const assignedGoals = await db.query.researchGoals.findMany({
                    where: and(
                        inArray(researchGoals.id, pair.assignedGoalIds),
                        eq(researchGoals.userId, userId)
                    ),
                });
                const progenyCreatures = await db.query.creatures.findMany({
                    where: and(
                        inArray(creatures.id, progenyIds),
                        eq(creatures.userId, userId)
                    ),
                });

                for (const progeny of progenyCreatures) {
                    for (const goal of assignedGoals) {
                        if (progeny.species !== goal.species) continue;

                        const isAchieved = checkGoalAchieved(progeny, goal);
                        if (isAchieved) {
                            const existingAchievement =
                                await db.query.achievedGoals.findFirst({
                                    where: and(
                                        eq(achievedGoals.goalId, goal.id),
                                        eq(
                                            achievedGoals.matchingProgenyId,
                                            progeny.id
                                        )
                                    ),
                                });
                            if (!existingAchievement) {
                                await db.insert(achievedGoals).values({
                                    userId,
                                    goalId: goal.id,
                                    logEntryId: newLogEntry.id,
                                    matchingProgenyId: progeny.id,
                                    achievedAt: new Date(),
                                });
                                revalidatePath(`/research-goals/${goal.id}`);
                            }
                        }
                    }
                }
            }
        }

        revalidatePath("/breeding-pairs");

        return NextResponse.json(
            { message: "Breeding event logged successfully!" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to log breeding event:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
