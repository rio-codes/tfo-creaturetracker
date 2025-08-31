import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { creatures } from "@/src/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { constructTfoImageUrl } from "@/lib/tfo-utils";
import { fetchAndUploadWithRetry } from "@/lib/data";

const createCreatureSchema = z.object({
    creatureName: z.string().min(1),
    creatureCode: z.string().min(1),
    species: z.string().min(1),
    genes: z.record(z.string(), z.object({
        genotype: z.string(),
        phenotype: z.string(),
        isMultiGenotype: z.boolean(),
    })),
});

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = createCreatureSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: "Invalid input.", details: validated.error.flatten() }, { status: 400 });
        }

        const { creatureName, creatureCode, species, genes } = validated.data;

        // 1. Construct genetics string and genotypes for URL
        const genotypesForUrl: { [key: string]: string } = {};
        const geneParts: string[] = [];
        let gender = "unknown";

        for (const [category, geneInfo] of Object.entries(genes)) {
            genotypesForUrl[category] = geneInfo.genotype;
            geneParts.push(`${category}:${geneInfo.genotype}`);
            if (category === "Gender") {
                gender = geneInfo.genotype;
            }
        }
        const geneticsString = geneParts.join(',');

        // 2. Create image
        const tfoImageUrl = constructTfoImageUrl(species, genotypesForUrl);
        const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
        const blobUrl = await fetchAndUploadWithRetry(bustedTfoImageUrl, creatureCode, 3);

        // 3. Insert into database
        await db.insert(creatures).values({
            userId,
            code: creatureCode,
            creatureName,
            species,
            genetics: geneticsString,
            imageUrl: blobUrl,
            gender: gender as 'male' | 'female' | 'unknown',
            growthLevel: 3, // Default to adult
            isPinned: false,
            updatedAt: new Date(),
        });

        revalidatePath('/collection');
        return NextResponse.json({ message: "Creature created successfully!" }, { status: 201 });

    } catch (error: any) {
        console.error("Failed to create creature:", error);
        return NextResponse.json({ error: error.message || "An internal error occurred." }, { status: 500 });
    }
}
