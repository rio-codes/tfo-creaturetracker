import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { breedingLogEntries, breedingPairs } from "@/src/db/schema";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const logEntrySchema = z.object({
    pairId: z.string().uuid("A valid pair ID is required."),
    progeny1Id: z.string().uuid().optional().nullable(),
    progeny2Id: z.string().uuid().optional().nullable(),
    notes: z.string().optional(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = logEntrySchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json(
                { error: "Invalid input.", details: validated.error.flatten() },
                { status: 400 }
            );
        }
        const { pairId, progeny1Id, progeny2Id, notes } = validated.data;

        // Verify that the pair belongs to the current user
        const pair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.id, pairId),
                eq(breedingPairs.userId, userId)
            ),
        });
        if (!pair) {
            return NextResponse.json(
                { error: "Breeding pair not found." },
                { status: 404 }
            );
        }

        // Insert the new log entry
        await db.insert(breedingLogEntries).values({
            userId,
            pairId,
            progeny1Id,
            progeny2Id,
            notes,
        });

        // Revalidate relevant pages to show updated stats
        revalidatePath("/breeding-pairs");

        return NextResponse.json(
            { message: "Breeding event logged successfully!" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to log breeding event:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
