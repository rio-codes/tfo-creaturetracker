import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { breedingPairs, creatures, researchGoals } from "@/src/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { validatePairing } from "@/lib/breeding-rules";
import { and, eq, inArray } from "drizzle-orm";

const createPairSchema = z.object({
    pairName: z
        .string()
        .min(3, "Pair name must be at least 3 characters.")
        .max(32, "Pair name can not be more than 32 characters."),
    species: z.string().min(1, "Species is required."),
    maleParentId: z.string().uuid("Invalid male parent ID."),
    femaleParentId: z.string().uuid("Invalid female parent ID."),
    assignedGoalIds: z.array(z.string().uuid()).optional(), // Array of goal IDs
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
        const validated = createPairSchema.safeParse(body);

        if (!validated.success) {
            const fieldErrors = z.flattenError(validated.error).fieldErrors;
            const allErrorArrays = Object.values(fieldErrors);
            const allErrors = allErrorArrays.flat();
            const errorString = allErrors.join("\n");
            console.error("Zod Validation Failed:", fieldErrors);
            return NextResponse.json(
                { error: "Invalid input.", details: errorString },
                { status: 400 }
            );
        }
        const {
            pairName,
            species,
            maleParentId,
            femaleParentId,
            assignedGoalIds,
        } = validated.data;

        const [maleParent, femaleParent] = await Promise.all([
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
        ]);

        if (!maleParent || !femaleParent) {
            return NextResponse.json(
                { error: "One or both parents not found." },
                { status: 404 }
            );
        }

        // Check if a pair with these exact parents already exists for this user
        const existingPair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.userId, userId),
                eq(breedingPairs.maleParentId, maleParentId),
                eq(breedingPairs.femaleParentId, femaleParentId)
            ),
        });

        if (existingPair) {
            return NextResponse.json(
                { error: "A breeding pair with these parents already exists." },
                { status: 409 }
            );
        }

        const pairingValidation = validatePairing(maleParent, femaleParent);
        if (!pairingValidation.isValid) {
            return NextResponse.json(
                { error: pairingValidation.error },
                { status: 400 }
            );
        }

        const [newPair] = await db
            .insert(breedingPairs)
            .values({
                userId: session.user.id,
                pairName,
                species,
                maleParentId,
                femaleParentId,
                assignedGoalIds: assignedGoalIds || [], // Default to an empty array if none are provided
                updatedAt: new Date(),
            })
            .returning({ id: breedingPairs.id });

        // if goals were assigned during creation, update them to include this new pair
        if (assignedGoalIds && assignedGoalIds.length > 0 && newPair) {
            console.log("updating goals");
            const goalsToUpdate = await db.query.researchGoals.findMany({
                where: and(
                    inArray(researchGoals.id, assignedGoalIds),
                    eq(researchGoals.userId, userId)
                ),
            });

            // update associated research goals with assigned pair ids
            for (const goal of goalsToUpdate) {
                const currentPairIds = new Set(goal.assignedPairIds || []);
                console.log("updating pair ", currentPairIds)
                currentPairIds.add(newPair.id);
                await db
                    .update(researchGoals)
                    .set({ assignedPairIds: Array.from(currentPairIds) })
                    .where(eq(researchGoals.id, goal.id));
                revalidatePath(`/research-goals/${goal.id}`);
            }
        }

        // Revalidate the path so the new pair shows up immediately
        revalidatePath("/breeding-pairs");
        revalidatePath("/research-goals");

        return NextResponse.json(
            { message: "Breeding pair created successfully!" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to create breeding pair:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
