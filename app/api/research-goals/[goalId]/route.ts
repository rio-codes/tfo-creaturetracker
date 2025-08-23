import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { researchGoals } from "@/src/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { constructTfoImageUrl } from "@/lib/tfo-utils";
import { put as vercelBlobPut } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { structuredGeneData } from "@/lib/creature-data";

const editGoalSchema = z.object({
    name: z
        .string()
        .min(3, "Name must be at least 3 characters.")
        .max(32, "Pair name can not be more than 32 characters."),
    species: z.string().min(1, "Species is required."),
    genes: z.record(z.string(), z.string()),
});

interface GenesObject {
    [key: string]: string;
}

export function validateGoalData(species: string, genes: GenesObject) {
    const speciesData = structuredGeneData[species];
    if (!speciesData) {
        throw new Error(`Invalid species provided: ${species}`);
    }

    for (const [category, selectedGenotype] of Object.entries(genes)) {
        const categoryData = speciesData[category];
        if (!categoryData) {
            throw new Error(
                `Invalid gene category "${category}" for species "${species}".`
            );
        }

        const isValidGenotype = (categoryData as { genotype: string }[]).some(
            (gene) => gene.genotype === selectedGenotype
        );

        if (!isValidGenotype) {
            throw new Error(
                `Invalid genotype "${selectedGenotype}" for category "${category}".`
            );
        }
    }
}

export async function PATCH(
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

    try {
        const body = await req.json();
        const validatedFields = editGoalSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json(
                {
                    error: "Invalid data provided.",
                    details: validatedFields.error.flatten(),
                },
                { status: 400 }
            );
        }
        const { name, species, genes } = validatedFields.data;
        validateGoalData(species, genes);

        // --- Fetch-and-Store new image ---
        const tfoImageUrl = constructTfoImageUrl(species, genes);
        const imageResponse = await fetch(tfoImageUrl);
        if (!imageResponse.ok)
            throw new Error("Failed to fetch generated image from TFO.");
        const imageBlob = await imageResponse.blob();
        const filename = `goals/${crypto.randomUUID()}.png`;
        const blob = await vercelBlobPut(filename, imageBlob, {
            access: "public",
            contentType: "image/png",
        });

        // Securely update the goal only if it belongs to the logged-in user
        const result = await db
            .update(researchGoals)
            .set({
                name,
                species,
                genes,
                imageUrl: blob.url,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(researchGoals.id, params.goalId),
                    eq(researchGoals.userId, session.user.id)
                )
            )
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                {
                    error: "Goal not found or you do not have permission to edit it.",
                },
                { status: 404 }
            );
        }

        revalidatePath("/research-goals");
        return NextResponse.json({ message: "Goal updated successfully!" });
    } catch (error: any) {
        console.error("Failed to update research goal:", error);
        return NextResponse.json(
            { error: error.message || "An internal error occurred." },
            { status: 500 }
        );
    }
}

// --- DELETE A GOAL ---
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

    try {
        const result = await db
            .delete(researchGoals)
            .where(
                and(
                    eq(researchGoals.id, params.goalId),
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
        return NextResponse.json({ message: "Goal deleted successfully." });
    } catch (error: any) {
        console.error("Failed to delete research goal:", error);
        return NextResponse.json(
            { error: error.message || "An internal error occurred." },
            { status: 500 }
        );
    }
}
