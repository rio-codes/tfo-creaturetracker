import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { z } from 'zod';
import { sql } from 'drizzle-orm';


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

export async function POST(req: Request) {
    if (!process.env.TFO_API_KEY) {
        console.error("CRITICAL: TFO_API_KEY is not set in the environment variables.");
        return NextResponse.json({ error: 'Server configuration error. Contact administrator.' }, { status: 500 });
    }
    
    const session = await auth();
    if (!session?.user?.id) {
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

    // Prepare creatures for database upsert
    const creatureValues = data.creatures.map((c: any) => ({
        userId: session.user.id,
        code: c.code,
        creatureName: c.name,
        imageUrl: c.imgsrc,
        gottenAt: c.gotten ? new Date(c.gotten * 1000) : null,
        growthLevel: c.growthLevel,
        isStunted: c.isStunted,
        species: c.breedName,
        genetics: c.genetics,
        gender: c.gender.toLowerCase(), // Ensure gender is lowercase for the enum
        updatedAt: new Date(),
    }));

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
        })

    return NextResponse.json({
        message: `Successfully synced ${creatureValues.length} creatures.`
    }, { status: 200 });

    } catch (error) {
        console.error("Creature sync failed:", error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}