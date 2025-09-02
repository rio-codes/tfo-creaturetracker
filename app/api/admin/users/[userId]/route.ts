import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit";

export async function DELETE(
    req: Request,
    { params }: { params: { userId: string } }
) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (params.userId === session.user.id) {
        return NextResponse.json(
            { error: "Admins cannot delete themselves." },
            { status: 400 }
        );
    }

    try {
        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, params.userId),
            columns: { username: true, email: true },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "User not found." },
                { status: 404 }
            );
        }

        await db.delete(users).where(eq(users.id, params.userId));

        await logAdminAction({
            action: "user.delete",
            targetType: "user",
            targetId: params.userId,
            details: {
                deletedUsername: targetUser.username,
                deletedEmail: targetUser.email,
            },
        });

        return NextResponse.json({ message: "User deleted successfully." });
    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
