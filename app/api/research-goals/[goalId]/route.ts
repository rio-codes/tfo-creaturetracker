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
import { fetchAndUploadWithRetry } from "@/lib/data";




const editGoalSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters."),
    species: z.string().min(1, "Species is required."),
    genes: z.record(
        z.string(),
        z.object({
            genotype: z.string(),
            phenotype: z.string(),
            isMultiGenotype: z.boolean(),
        })
    ),
    goalMode: z.enum(["genotype", "phenotype"]),
});

interface GenesObject {
    [key: string]: string;
}


// function to make sure species, categories, and genotypes are valid
export function validateGoalData(
    species: string,
    genes: { [key: string]: { genotype: string; phenotype: string } }
) {
    const speciesData = structuredGeneData[species];
    if (!speciesData) {
        throw new Error(`Invalid species provided: ${species}`);
    }

    for (const [category, selection] of Object.entries(genes)) {
        const categoryData = speciesData[category] as { genotype: string }[];
        if (!categoryData) {
            throw new Error(
                `Invalid gene category "${category}" for species "${species}".`
            );
        }
        const isValidGenotype = categoryData.some(
            (gene) => gene.genotype === selection.genotype
        );
        if (!isValidGenotype) {
            throw new Error(
                `Invalid genotype "${selection.genotype}" for category "${category}".`
            );
        }
    }
}

// edit exisiting research goal
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
        // check received data against zod schema
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
        const { name, species, genes, goalMode } = validatedFields.data;
    
        // use validation function to check species, category, and genotype
        validateGoalData(species, genes);

        // fetch new image from tfo and store it in vercel blob
        const genotypesForUrl = Object.fromEntries(
            Object.entries(genes).map(([category, selection]) => [
                category,
                selection.genotype,
            ])
        );
        const tfoImageUrl = constructTfoImageUrl(species, genotypesForUrl);
        const blobUrl = await fetchAndUploadWithRetry(tfoImageUrl, null, 3);

        // insert new research goal into db
        const result = await db
            .update(researchGoals)
            .set({
                name,
                species,
                genes,
                goalMode,
                imageUrl: blobUrl,
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

// delete research goal
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
