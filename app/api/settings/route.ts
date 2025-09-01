import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { hash } from "bcryptjs";
import * as Sentry from "@sentry/nextjs";

const settingsSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().min(12).optional().or(z.literal('')),
    collectionItemsPerPage: z.number().min(3).max(30).optional(),
    goalsItemsPerPage: z.number().min(3).max(30).optional(),
    pairsItemsPerPage: z.number().min(3).max(30).optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
    goalConversions: z.any().optional(),
});

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = settingsSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: "Invalid input.", details: validated.error.flatten() }, { status: 400 });
        }

        const { password, ...updateData } = validated.data;
        const dataToUpdate: Partial<typeof users.$inferInsert> = { ...updateData };

        if (password) {
            dataToUpdate.password = await hash(password, 10);
        }

        if (body.goalConversions) {
            // Logic for goal conversions would go here
        }

        if (Object.keys(dataToUpdate).length > 0) {
            await db.update(users)
                .set(dataToUpdate)
                .where(eq(users.id, userId));
        }

        return NextResponse.json({ message: "Settings updated successfully!" });

    } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json({ error: "An internal error occurred." }, { status: 500 });
    }
}