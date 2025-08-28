import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { researchGoals } from "@/src/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { TFO_SPECIES_CODES } from "@/lib/creature-data";
import { constructTfoImageUrl } from "@/lib/tfo-utils";
import { structuredGeneData } from "@/lib/creature-data";
import { fetchAndUploadWithRetry } from "@/lib/data";

const goalSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters."),
    species: z.string().min(1, "Species is required."),
    genes: z.record(
        z.string(),
        z.object({
            genotype: z.string(),
            phenotype: z.string(),
        })
    ),
    goalMode: z.enum(["genotype", "phenotype"]),
});  

interface GenesObject {
    [key: string]: string;
}

// function to make sure species, categories, and genotypes are valid
export function validateGoalData(species: string, genes: GenesObject) {
    const speciesData = structuredGeneData[species];
    if (!speciesData) {
        throw new Error(`Invalid species provided: ${species}`);
    }

    // ensure each category is valid for species
    for (const [category, selectedGene] of Object.entries(genes)) {
        const selectedGenotype = selectedGene?["genotype"];
        const categoryData = speciesData[category];
        if (!categoryData) {
            throw new Error(
                `Invalid gene category "${category}" for species "${species}".`
            );
        }
        // ensure genotype exists for category
        const isValidGenotype = (categoryData as { genotype: string }[]).some(
            (gene) => gene.genotype === selectedGenotype
        );
        // error if genotype is not valid
        if (!isValidGenotype) {
            throw new Error(
                `Invalid genotype "${selectedGenotype}" for category "${category}".`
            );
        }
    }
}

// add new research goal
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
        // validate received data with zod schema
        const validatedFields = goalSchema.safeParse(body);
        if (!validatedFields.success) {
            console.error(
                "Zod Validation Failed:",
                validatedFields.error.flatten()
            );
            return NextResponse.json(
                {
                    error: "Invalid data provided.",
                    details: validatedFields.error.flatten(),
                },
                { status: 400 }
            );
        }
        const { name, species, genes } = validatedFields.data;
        // validate received data with custom function
        validateGoalData(species, genes);

        // ensure species is valid
        const speciesCode = TFO_SPECIES_CODES[species];
        if (!speciesCode)
            throw new Error(`Invalid species provided: ${species}`);

        // get genotype to construct image url
        const genotypesForUrl = Object.fromEntries(
            Object.entries(genes).map(([category, selection]) => {
                const geneSelection = selection as { genotype: string };
                return [category, geneSelection.genotype];
            })
        );

        // fetch new image from tfo and store it in vercel blob
        const tfoImageUrl = constructTfoImageUrl(species, genotypesForUrl);
        const blobUrl = await fetchAndUploadWithRetry(tfoImageUrl, null, 3)
        
        // insert new research goal into db
        await db.insert(researchGoals).values({
            userId: session.user.id,
            name: name,
            species: species,
            imageUrl: blobUrl,
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
