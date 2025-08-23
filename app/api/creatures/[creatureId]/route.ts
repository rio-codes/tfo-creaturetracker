import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { creatures } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// This function handles DELETE requests to /api/creatures/[creatureId]
export async function DELETE(
    req: Request,
    { params }: { params: { creatureId: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    const { creatureId } = params;
    if (!creatureId) {
        return NextResponse.json(
            { error: "Creature ID is required." },
            { status: 400 }
        );
    }

    try {
        const result = await db
            .delete(creatures)
            .where(
                and(
                    eq(creatures.id, creatureId),
                    eq(creatures.userId, session.user.id)
                )
            )
            .returning(); // .returning() gives us back the row that was deleted

        if (result.length === 0) {
            return NextResponse.json(
                {
                    error: "Creature not found or you do not have permission to delete it.",
                },
                { status: 404 }
            );
        }

        // Clear the cache for the collection page so the grid updates immediately
        revalidatePath("/collection");

        return NextResponse.json(
            { message: "Creature deleted successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Failed to delete creature:", error);
        // Handle potential foreign key constraint errors if a creature is part of a pair
        if (error.code === "23503") {
            // PostgreSQL foreign key violation error code
            return NextResponse.json(
                {
                    error: "Cannot delete this creature because it is part of an active breeding pair. Please remove it from the pair first.",
                },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
