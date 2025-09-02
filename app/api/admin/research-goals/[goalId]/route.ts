import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { researchGoals } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit";

export async function DELETE(
    req: Request,
    { params }: { params: { goalId: string } }
) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    try {
        const targetGoal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, params.goalId),
            columns: { name: true },
        });

        if (!targetGoal) {
            return NextResponse.json(
                { error: "Research goal not found." },
                { status: 404 }
            );
        }

        await db
            .delete(researchGoals)
            .where(eq(researchGoals.id, params.goalId));

        await logAdminAction({
            action: "research_goal.delete",
            targetType: "research_goal",
            targetId: params.goalId,
            details: {
                deletedGoalName: targetGoal.name,
            },
        });

        return NextResponse.json({
            message: "Research goal deleted successfully.",
        });
    } catch (error) {
        console.error("Failed to delete research goal:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
