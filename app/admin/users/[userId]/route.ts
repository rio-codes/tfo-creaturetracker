import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateRoleSchema = z.object({
    role: z.enum(["user", "admin"]),
});

export async function PATCH(req: Request, { params }: { params: { userId: string } }) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.user.id === params.userId) {
        return NextResponse.json({ error: "Admins cannot change their own role." }, { status: 400 });
    }

    try {
        const body = await req.json();
        const validated = updateRoleSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
        }

        await db.update(users)
            .set({ role: validated.data.role })
            .where(eq(users.id, params.userId));

        return NextResponse.json({ message: "User role updated successfully." });

    } catch (error) {
        console.error("Failed to update user role:", error);
        return NextResponse.json({ error: "An internal error occurred." }, { status: 500 });
    }
}
