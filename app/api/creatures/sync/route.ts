import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { put } from '@vercel/blob';

const syncSchema = z.object({
    tabId: z.coerce.number().int().min(0, "Tab ID must be a positive number."),
});

// TFO API error code mapping for user-friendly messages
const tfoErrorMap: { [key: number]: string } = {
    1: "User does not exist.",
    2: "User's lab is hidden.",
    5: "Invalid API call. This may be a temporary issue.",
    7: "Tab does not exist.",
    8: "Tab is hidden.",
};
async function fetchAndUploadWithRetry(
    imageUrl: string,
    creatureCode: string,
    retries = 3
): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Step 1: Fetch the image from the external URL
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(
                    `Failed to download image. Status: ${imageResponse.status}`
                );
            }
            const imageBlob = await imageResponse.blob();

            // Step 2: Upload the image to Vercel Blob
            const filename = `creatures/${creatureCode}.png`;
            const blob = await put(filename, imageBlob, {
                access: "public",
                contentType: imageBlob.type || "image/png",
                allowOverwrite: true, // Add this line
            });

            // If successful, return the new URL immediately
            return blob.url;
        } catch (error) {
            console.warn(
                `Attempt ${attempt} failed for creature ${creatureCode}: ${error.message}`
            );
            if (attempt === retries) {
                // If this was the last attempt, re-throw the error to be caught by the main logic
                throw new Error(
                    `All ${retries} attempts failed for ${creatureCode}.`
                );
            }
            // Wait before the next retry (e.g., 1 second)
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
    }
    // This part should not be reachable, but is a fallback
    throw new Error("Upload failed after all retries.");
}

export async function POST(req: Request) {
    const session = await auth();
    const userId = session?.user?.id;
    const username = session?.user?.username;

    if (!process.env.TFO_API_KEY) {
        console.error("CRITICAL: TFO_API_KEY is not set in the environment variables.");
        return NextResponse.json({ error: 'Server configuration error. Contact administrator.' }, { status: 500 });
    }

    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const result = syncSchema.safeParse(await req.json());
    if (!result.success) {
        return NextResponse.json({ error: 'Invalid Tab ID provided.' }, { status: 400 });
    }
    
    const { tabId } = result.data;

    try {
        const tfoApiUrl = `https://finaloutpost.net/api/v1/tab/${tabId}/${session.user.username}`;
        const response = await fetch(tfoApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiKey': process.env.TFO_API_KEY,
            }
        });
        
        if (!response.ok) {
            throw new Error(`TFO API responded with status: ${response.status}`);
        }
        const data = await response.json();

        if (data.error === true) {
            const errorMessage = tfoErrorMap[data.errorCode] || "An unknown error occurred with the TFO API.";
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        if (!data.creatures || data.creatures.length === 0) {
            return NextResponse.json({ message: 'No creatures found in that tab.' }, { status: 200 });
        }

        const creaturePromises = data.creatures.map(async (c: any) => {
            let newImageUrl = c.imgsrc; // Default to original URL

            try {
                // Call our new function with retry logic
                newImageUrl = await fetchAndUploadWithRetry(c.imgsrc, c.code);
            } catch (uploadError) {
                console.error(
                    `Failed to upload image for creature ${c.code} after all retries:`,
                    uploadError.message
                );
                // If all retries fail, we fall back to the original URL
                newImageUrl = c.imgsrc;
            }

            return {
                userId: userId,
                code: c.code,
                creatureName: c.name,
                imageUrl: newImageUrl,
                gottenAt: c.gotten ? new Date(c.gotten * 1000) : null,
                growthLevel: c.growthLevel,
                isStunted: c.isStunted,
                species: c.breedName,
                genetics: c.genetics,
                gender: c.gender.toLowerCase(),
                updatedAt: new Date(),
            };
        });

    const creatureValues = await Promise.all(creaturePromises);

    await db.insert(creatures)
        .values(creatureValues)
        .onConflictDoUpdate({
            target: [creatures.userId, creatures.code],
            set: {
                creatureName: sql`excluded.name`,
                imageUrl: sql`excluded.imgsrc`,
                gottenAt: sql`excluded.gotten_at`,
                growthLevel: sql`excluded.growth_level`,
                isStunted: sql`excluded.is_stunted`,
                species: sql`excluded.breed_name`,
                genetics: sql`excluded.genetics`,
                gender: sql`excluded.gender`,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({
            message: `Successfully synced ${creatureValues.length} creatures.`
        }, { status: 200 });

    } catch (error) {
        console.error("Creature sync failed:", error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}