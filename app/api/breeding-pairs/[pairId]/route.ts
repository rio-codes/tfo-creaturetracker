import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { breedingPairs, creatures, researchGoals } from "@/src/db/schema";
import {
    RegExpMatcher,
    TextCensor,
    englishDataset,
    englishRecommendedTransformers,
} from "obscenity";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { validatePairing } from "@/lib/breeding-rules";

const editPairSchema = z.object({
    pairName: z
        .string()
        .min(3, "Pair name must be at least 3 characters.")
        .max(32, "Pair name can not be more than 32 characters."),
    species: z.string().min(1, "Species is required."),
    maleParentId: z.string().uuid("Invalid male parent ID."),
    femaleParentId: z.string().uuid("Invalid female parent ID."),
    assignedGoalIds: z.array(z.string().uuid()).optional(),
});

export async function PATCH(
    req: Request,
    { params }: { params: { pairId: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        console.log(body);
        const validatedFields = editPairSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json(
                {
                    error: "Invalid data provided.",
                    details: validatedFields.error.flatten(),
                },
                { status: 400 }
            );
        }
        const { pairName, maleParentId, femaleParentId, assignedGoalIds } =
            validatedFields.data;

        const matcher = new RegExpMatcher({
            ...englishDataset.build(),
            ...englishRecommendedTransformers,
        });

        if (matcher.hasMatch(pairName)) {
            return NextResponse.json(
                { error: "The provided name contains inappropriate language." },
                { status: 400 }
            );
        }

        // Fetch the existing pair to compare assigned goals
        const existingPair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.id, params.pairId),
                eq(breedingPairs.userId, session.user.id)
            ),
        });

        if (!existingPair) {
            return NextResponse.json(
                { error: "Breeding pair not found." },
                { status: 404 }
            );
        }

        const [maleParent, femaleParent] = await Promise.all([
            db.query.creatures.findFirst({
                where: and(
                    eq(creatures.id, maleParentId),
                    eq(creatures.userId, session.user.id)
                ),
            }),
            db.query.creatures.findFirst({
                where: and(
                    eq(creatures.id, femaleParentId),
                    eq(creatures.userId, session.user.id)
                ),
            }),
        ]);

        if (!maleParent || !femaleParent) {
            return NextResponse.json(
                {
                    error: "One or both selected parents could not be found.",
                },
                { status: 404 }
            );
        }

        const pairingValidation = validatePairing(maleParent, femaleParent);
        if (!pairingValidation.isValid) {
            return NextResponse.json(
                { error: pairingValidation.error },
                { status: 400 }
            );
        }

        if (assignedGoalIds && assignedGoalIds.length > 0) {
            const goals = await db
                .select()
                .from(researchGoals)
                .where(
                    and(
                        inArray(researchGoals.id, assignedGoalIds),
                        eq(researchGoals.userId, session.user.id)
                    )
                );
            if (goals.length !== assignedGoalIds.length) {
                return NextResponse.json(
                    {
                        error: "One or more selected goals could not be found.",
                    },
                    { status: 404 }
                );
            }
            for (const goal of goals) {
                if (
                    goal.species !== maleParent.species ||
                    goal.species !== femaleParent.species
                ) {
                    return NextResponse.json(
                        {
                            error: `The goal "${goal.name}" cannot be assigned to a ${maleParent.species} pair.`,
                        },
                        { status: 400 }
                    );
                }
            }
        }

        const result = await db
            .update(breedingPairs)
            .set({
                pairName,
                maleParentId,
                femaleParentId,
                assignedGoalIds: assignedGoalIds || [],
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(breedingPairs.id, params.pairId),
                    eq(breedingPairs.userId, session.user.id)
                )
            )
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                {
                    error: "Pair not found or you do not have permission to edit it.",
                },
                { status: 404 }
            );
        }

        // --- Synchronize Goal Assignments ---
        const oldGoalIds = new Set(existingPair.assignedGoalIds || []);
        const newGoalIds = new Set(assignedGoalIds || []);

        const goalsAdded = [...newGoalIds].filter((id) => !oldGoalIds.has(id));
        const goalsRemoved = [...oldGoalIds].filter(
            (id) => !newGoalIds.has(id)
        );

        // Update goals that had this pair added
        if (goalsAdded.length > 0) {
            const goalsToUpdate = await db.query.researchGoals.findMany({
                where: and(
                    inArray(researchGoals.id, goalsAdded),
                    eq(researchGoals.userId, session.user.id)
                ),
            });
            for (const goal of goalsToUpdate) {
                const currentPairIds = new Set(goal.assignedPairIds || []);
                currentPairIds.add(params.pairId);
                await db
                    .update(researchGoals)
                    .set({ assignedPairIds: Array.from(currentPairIds) })
                    .where(eq(researchGoals.id, goal.id));
                revalidatePath(`/research-goals/${goal.id}`);
            }
        }

        // Update goals that had this pair removed
        if (goalsRemoved.length > 0) {
            const goalsToUpdate = await db.query.researchGoals.findMany({
                where: and(
                    inArray(researchGoals.id, goalsRemoved),
                    eq(researchGoals.userId, session.user.id)
                ),
            });
            for (const goal of goalsToUpdate) {
                const currentPairIds = new Set(goal.assignedPairIds || []);
                currentPairIds.delete(params.pairId);
                await db
                    .update(researchGoals)
                    .set({ assignedPairIds: Array.from(currentPairIds) })
                    .where(eq(researchGoals.id, goal.id));
                revalidatePath(`/research-goals/${goal.id}`);
            }
        }

        revalidatePath("/breeding-pairs");
        revalidatePath("/research-goals");

        return NextResponse.json({
            message: "Breeding pair updated successfully!",
        });
    } catch (error: any) {
        console.error("Failed to update breeding pair:", error);
        return NextResponse.json(
            { error: error.message || "An internal error occurred." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { pairId: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    try {
        const result = await db
            .delete(breedingPairs)
            .where(
                and(
                    eq(breedingPairs.id, params.pairId),
                    eq(breedingPairs.userId, session.user.id)
                )
            )
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                {
                    error: "Pair not found or you do not have permission to delete it.",
                },
                { status: 404 }
            );
        }

        revalidatePath("/breeding-pairs");
        return NextResponse.json({
            message: "Breeding pair deleted successfully.",
        });
    } catch (error: any) {
        console.error("Failed to delete breeding pair:", error);
        return NextResponse.json(
            { error: error.message || "An internal error occurred." },
            { status: 500 }
        );
    }
}
