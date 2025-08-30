import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { breedingPairs } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { constructTfoImageUrl } from "@/lib/tfo-utils";
import { fetchAndUploadWithRetry } from "@/lib/data";
import { revalidatePath } from "next/cache";

const previewSchema = z.object({
    selectedGenotypes: z.record(z.string(), z.string()),
});

export async function POST(
    req: Request,
    { params }: { params: { pairId: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = previewSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: "Invalid input." }, { status: 400 });
        }

        const { selectedGenotypes } = validated.data;

        const pair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.id, params.pairId),
                eq(breedingPairs.userId, session.user.id)
            ),
        });

        if (!pair) {
            return NextResponse.json({ error: "Breeding pair not found." }, { status: 404 });
        }

        const tfoImageUrl = constructTfoImageUrl(pair.species, selectedGenotypes);
        // Add a cache-busting parameter to the TFO URL to ensure we get a fresh image
        // from their server and not a stale cached version. This complements the
        // `cache: 'no-store'` setting in the fetch call for defense-in-depth.
        const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
        // The reference ID is prefixed to distinguish it from creature codes in fetchAndUploadWithRetry
        const blobUrl = await fetchAndUploadWithRetry(bustedTfoImageUrl, `pair-preview-${pair.id}`, 3);

        // Update the default preview URL on the pair itself.
        // This will be used as the cached image on the dialog's first open.
        await db.update(breedingPairs)
            .set({ outcomesPreviewUrl: blobUrl })
            .where(eq(breedingPairs.id, pair.id));
        
        revalidatePath("/breeding-pairs");

        return NextResponse.json({ imageUrl: blobUrl });
    } catch (error: any) {
        console.error("Failed to generate outcomes preview:", error);
        return NextResponse.json({ error: "An internal error occurred." }, { status: 500 });
    }
}
