import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { researchGoals } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function DELETE(
    req: Request,
    { params }: { params: { goalId: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    const { goalId } = params;
    if (!goalId) {
        return NextResponse.json(
            { error: "Goal ID is required." },
            { status: 400 }
        );
    }

    try {
        const result = await db
            .delete(researchGoals)
            .where(
                and(
                    eq(researchGoals.id, goalId),
                    eq(researchGoals.userId, session.user.id)
                )
            )
            .returning(); 

        if (result.length === 0) {
            return NextResponse.json(
                {
                    error: "Goal not found or you do not have permission to delete it.",
                },
                { status: 404 }
            );
        }
        revalidatePath("/research-goals");

        return NextResponse.json(
            { message: "Goal deleted successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Failed to delete research goal:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
