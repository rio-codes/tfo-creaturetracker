import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { breedingPairs, creatures, researchGoals } from "@/src/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

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
        if (maleParent.gender !== "male" || femaleParent.gender !== "female") {
            return NextResponse.json(
                { error: "Parents must be one male and one female." },
                { status: 400 }
            );
        }
        if (maleParent.growthLevel !== 3 || femaleParent.growthLevel !== 3) {
            return NextResponse.json(
                { error: "Only adult creatures can be paired." },
                { status: 400 }
            );
        }
        if (maleParent.species !== femaleParent.species) {
            return NextResponse.json(
                { error: "Parents must be of the same species." },
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

        revalidatePath("/breeding-pairs");
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
