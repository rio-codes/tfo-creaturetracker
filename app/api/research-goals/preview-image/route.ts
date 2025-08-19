import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { constructTfoImageUrl } from "@/lib/tfo-utils";

const previewSchema = z.object({
    species: z.string().min(1),
    genes: z.record(z.string(), z.string()),
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
        const validatedFields = previewSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: "Invalid data provided." },
                { status: 400 }
            );
        }
        const { species, genes } = validatedFields.data;

        const imageUrl = constructTfoImageUrl(species, genes);

        return NextResponse.json({ imageUrl });
    } catch (error: any) {
        console.error("Failed to generate preview URL:", error);
        return NextResponse.json(
            { error: error.message || "An internal error occurred." },
            { status: 500 }
        );
    }
}
