import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { users, researchGoals } from "@/src/db/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

// Zod schema for validating the incoming settings data
const settingsSchema = z.object({
    email: z.string().email().optional(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters.")
        .optional(),
    goalMode: z.enum(["genotype", "phenotype"]).optional(),
    collectionItemsPerPage: z.coerce.number().int().min(3).max(30).optional(),
    goalsItemsPerPage: z.coerce.number().int().min(3).max(30).optional(),
    pairsItemsPerPage: z.coerce.number().int().min(3).max(30).optional(),
    goalConversions: z
        .record(
            z.string(),
            z.record(
                z.string(),
                z.object({
                    genotype: z.string(),
                    phenotype: z.string(),
                })
            )
        )
        .optional(),
});

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const validated = settingsSchema.safeParse(body);

        if (!validated.success) {
            const fieldErrors = z.flattenError(validated.error).fieldErrors;
            console.log(fieldErrors)
            const allErrorArrays = Object.values(fieldErrors);
            const allErrors = allErrorArrays.flat();
            const errorString = allErrors.join("\n");
            console.error("Zod Validation Failed:", errorString);
            return NextResponse.json(
                { error: errorString }, 
                { status: 400 }
            );
        }

        const { password, goalConversions, ...otherSettings } = validated.data;
        const settingsToUpdate: Partial<typeof users.$inferInsert> = {};
        Object.assign(settingsToUpdate, otherSettings);

        if (password) {
            settingsToUpdate.password = await hash(password, 12);
        }

        // Use a transaction to update settings and goals together
        await db.transaction(async (tx) => {
            // Update the user's settings
            await tx
                .update(users)
                .set(settingsToUpdate)
                .where(eq(users.id, session.user.id!));

            // If there are goal conversions, update them
            if (goalConversions && Object.keys(goalConversions).length > 0) {
                for (const [goalId, newGeneData] of Object.entries(
                    goalConversions
                )) {
                    // First, fetch the goal to ensure it belongs to the user
                    const goal = await tx.query.researchGoals.findFirst({
                        where: and(
                            eq(researchGoals.id, goalId),
                            eq(researchGoals.userId, session.user.id!)
                        ),
                    });
                    // If the goal exists, update its `genes` object
                    if (goal) {
                        const updatedGenes = { ...goal.genes, ...newGeneData };
                        await tx
                            .update(researchGoals)
                            .set({ genes: updatedGenes })
                            .where(eq(researchGoals.id, goalId));
                    }
                }
            }
        });

        revalidatePath("/settings");
        revalidatePath("/research-goals"); // Also revalidate goals page

        return NextResponse.json({ message: "Settings updated successfully!" });
    } catch (error) {
        console.error("Failed to update settings:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
