import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { breedingPairs } from "@/src/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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
