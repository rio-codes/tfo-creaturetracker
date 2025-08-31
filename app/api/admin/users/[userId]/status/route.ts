import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { users, userStatusEnum } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const updateStatusSchema = z.object({
    status: z.enum(userStatusEnum.enumValues),
});

export async function PATCH(req: Request, { params }: { params: { userId: string } }) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.user.id === params.userId) {
        return NextResponse.json({ error: "Admins cannot change their own status." }, { status: 400 });
    }

    try {
        const body = await req.json();
        const validated = updateStatusSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: "Invalid status specified." }, { status: 400 });
        }

        await db.update(users)
            .set({ status: validated.data.status })
            .where(eq(users.id, params.userId));

        return NextResponse.json({ message: "User status updated successfully." });

    } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json({ error: "An internal error occurred." }, { status: 500 });
    }
}