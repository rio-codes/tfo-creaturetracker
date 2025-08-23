import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { creatures, researchGoals, users } from "@/src/db/schema";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { calculateGeneProbability } from "@/lib/genetics"; // Your genetics engine

const predictionSchema = z.object({
    maleParentId: z.string().uuid(),
    femaleParentId: z.string().uuid(),
    goalIds: z.array(z.string().uuid()).optional(),
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
        const validated = predictionSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json(
                { error: "Invalid input." },
                { status: 400 }
            );
        }
        const { maleParentId, femaleParentId, goalIds } = validated.data;

        // 1. Fetch all necessary data in parallel
        const [user, maleParent, femaleParent, goals] = await Promise.all([
            db.query.users.findFirst({ where: eq(users.id, userId) }),
            db.query.creatures.findFirst({
                where: and(
                    eq(creatures.id, maleParentId),
                    eq(creatures.userId, userId)
                ),
            }),
            db.query.creatures.findFirst({
                where: and(
                    eq(creatures.id, femaleParentId),
                    eq(creatures.userId, userId)
                ),
            }),
            goalIds && goalIds.length > 0
                ? db.query.researchGoals.findMany({
                        where: and(
                            inArray(researchGoals.id, goalIds),
                            eq(researchGoals.userId, userId)
                        ),
                    })
                : Promise.resolve([]),
        ]);

        if (!user || !maleParent || !femaleParent) {
            return NextResponse.json(
                { error: "Could not find user or parent creatures." },
                { status: 404 }
            );
        }

        // 2. Calculate predictions for each goal
        const predictions = goals.map((goal) => {
            let totalChance = 0;
            let geneCount = 0;
            for (const [category, targetGene] of Object.entries(goal.genes)) {
                const chance = calculateGeneProbability(
                    maleParent,
                    femaleParent,
                    category,
                    targetGene as any,
                    user.goalMode
                );
                totalChance += chance;
                geneCount++;
            }
            const averageChance = geneCount > 0 ? totalChance / geneCount : 0;
            return {
                goalId: goal.id,
                goalName: goal.name,
                averageChance,
            };
        });

        return NextResponse.json({ predictions });
    } catch (error) {
        console.error("Prediction calculation failed:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
