import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { researchGoals } from "@/src/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { TFO_SPECIES_CODES } from "@/lib/creature-data";
import { put as vercelBlobPut } from "@vercel/blob";
import { constructTfoImageUrl } from "@/lib/tfo-utils";
import { structuredGeneData } from "@/lib/creature-data";

interface GenesObject {
    [key: string]: string;
}

const goalSchema = z.object({
    name: z.string().min(3),
    species: z.string().min(1),
    genes: z.record(
        z.string(),
        z.object({
            genotype: z.string(),
            phenotype: z.string(),
        })
    ),
});

export function validateGoalData(species: string, genes: GenesObject) {
    const speciesData = structuredGeneData[species];
    if (!speciesData) {
        throw new Error(`Invalid species provided: ${species}`);
    }

    for (const [category, selectedGene] of Object.entries(genes)) {
        const selectedGenotype = selectedGene["genotype"] 
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

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const validatedFields = goalSchema.safeParse(body);

        if (!validatedFields.success) {
            console.error("Zod Validation Failed:", validatedFields.error.flatten());
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

        const speciesCode = TFO_SPECIES_CODES[species];
        if (!speciesCode)
            throw new Error(`Invalid species provided: ${species}`);

        const genotypesForUrl = Object.fromEntries(
            Object.entries(genes).map(([category, selection]) => [
                category,
                selection.genotype,
            ])
        );

        const tfoImageUrl = constructTfoImageUrl(species, genotypesForUrl);

        let finalImageUrl = "";

        console.log(`Fetching dynamic image from: ${tfoImageUrl.toString()}`);
        const imageResponse = await fetch(tfoImageUrl.toString());

        if (!imageResponse.ok) {
            throw new Error(
                `Failed to fetch the generated image from TFO. Status: ${imageResponse.status}`
            );
        }
        const imageBlob = await imageResponse.blob();

        const filename = `goals/${crypto.randomUUID()}.png`;
        const blob = await vercelBlobPut(filename, imageBlob, {
            access: "public",
            contentType: "image/png",
        });

        finalImageUrl = blob.url;
        console.log(
            `Successfully uploaded image to Vercel Blob: ${finalImageUrl}`
        );

        await db.insert(researchGoals).values({
            userId: session.user.id,
            name: name,
            species: species,
            imageUrl: finalImageUrl,
            genes: genes,
            updatedAt: new Date(),
        });

        revalidatePath("/research-goals");

        return NextResponse.json(
            { message: "Research Goal created successfully!" },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Failed to create research goal:", error);
        return NextResponse.json(
            { error: error.message || "An internal error occurred." },
            { status: 500 }
        );
    }
}
