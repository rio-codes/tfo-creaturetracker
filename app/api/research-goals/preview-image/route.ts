import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { constructTfoImageUrl } from "@/lib/tfo-utils";

const previewSchema = z.object({
    species: z.string().min(1),
    genes: z.record(
        z.string(), // The key is the category (string)
        z.object({
            // The value is an object with this shape
            genotype: z.string(),
            phenotype: z.string(),
        })
    ),
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
        console.log("Received ", body)
        const validatedFields = previewSchema.safeParse(body);
        
        if (!validatedFields.success) {
            const fieldErrors = z.flattenError(validatedFields.error).fieldErrors;
            const allErrorArrays = Object.values(fieldErrors);
            const allErrors = allErrorArrays.flat();
            const errorString = allErrors.join("\n");
            console.error("Zod Validation Failed:", errorString);
            return NextResponse.json(
                { error: "Invalid data provided." },
                { status: 400 }
            );
        }
        const { species, genes } = validatedFields.data;

        const genotypesForUrl = Object.fromEntries(
            Object.entries(genes).map(([category, selection]) => [
                category,
                selection.genotype,
            ])
        );

        const imageUrl = constructTfoImageUrl(species, genotypesForUrl);

        return NextResponse.json({ imageUrl });
    } catch (error: any) {
        console.error("Failed to generate preview URL:", error);
        return NextResponse.json(
            { error: error.message || "An internal error occurred." },
            { status: 500 }
        );
    }
}
