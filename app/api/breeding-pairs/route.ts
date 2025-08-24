import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { breedingPairs, creatures } from "@/src/db/schema";
import { breedingPairs, creatures } from "@/src/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { validatePairing } from "@/lib/breeding-rules"; 
import { and, eq } from "drizzle-orm";
import { validatePairing } from "@/lib/breeding-rules";
import { and, eq } from "drizzle-orm";

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
    
    const userId = session.user.id

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
        
        const pairingValidation = validatePairing(maleParent, femaleParent);
        if (!pairingValidation.isValid) {
            return NextResponse.json(
                { error: pairingValidation.error },
                { status: 400 }
            );
        }

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

        const pairingValidation = validatePairing(maleParent, femaleParent);
        if (!pairingValidation.isValid) {
            return NextResponse.json(
                { error: pairingValidation.error },
                { status: 400 }
            );
        }

        await db.insert(breedingPairs).values({
            userId: session.user.id,
            pairName,
            species,
            maleParentId,
            femaleParentId,
            assignedGoalIds: assignedGoalIds || [], // Default to an empty array if none are provided
            updatedAt: new Date(),
        });

        // Revalidate the path so the new pair shows up immediately
        revalidatePath("/breeding-pairs");

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
