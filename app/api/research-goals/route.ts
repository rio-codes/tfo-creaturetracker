// app/api/research-goals/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { researchGoals } from "@/src/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { speciesCodes } from "@/app/lib/creature_data";
import { put as vercelBlobPut } from "@vercel/blob";

const goalSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters."),
    species: z.string().min(1, "Species is required."),
    genes: z.record(z.string()),
});

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
            return NextResponse.json(
                {
                    error: "Invalid data provided.",
                    details: validatedFields.error.flatten(),
                },
                { status: 400 }
            );
        }
        const { name, species, genes } = validatedFields.data;

        const speciesCode = speciesCodes[species];
        if (!speciesCode)
            throw new Error(`Invalid species provided: ${species}`);

        const gender = genes["Gender"]?.toLowerCase();
        if (!["male", "female"].includes(gender))
            throw new Error("A valid gender must be selected.");

        const geneticsString = Object.entries(genes)
            .map(([cat, gen]) => `${cat}:${gen}`)
            .join(",");

        const tfoImageUrl = new URL("https://finaloutpost.net/ln");
        tfoImageUrl.searchParams.append("s", speciesCode);
        tfoImageUrl.searchParams.append("c", geneticsString);
        tfoImageUrl.searchParams.append("g", gender);

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
