import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { encode } from "next-auth/jwt";
import { logAdminAction } from "@/lib/audit";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { userId: targetUserId } = await req.json();
    if (!targetUserId) {
        return NextResponse.json(
            { error: "User ID is required" },
            { status: 400 }
        );
    }

    const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetUserId),
    });

    if (!targetUser) {
        return NextResponse.json(
            { error: "Target user not found" },
            { status: 404 }
        );
    }

    const adminUser = session.user;

    await logAdminAction({
        action: "user.impersonate",
        targetType: "user",
        targetId: targetUser.id,
        details: { impersonatedUsername: targetUser.username },
    });

    const token = {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        username: targetUser.username,
        role: targetUser.role,
        theme: targetUser.theme,
        impersonator: {
            id: adminUser.id,
            username: adminUser.username,
        },
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiry
    };

    const sessionToken = await encode({
        token,
        secret: process.env.AUTH_SECRET!,
        salt: "",
    });

    (await cookies()).set({
        name: "authjs.tfoct-session-token",
        value: sessionToken,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({ message: "Impersonation successful" });
}
