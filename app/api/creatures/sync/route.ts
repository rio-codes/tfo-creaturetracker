import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { z } from 'zod';
import { fetchAndUploadWithRetry } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';

type CreatureInsert = typeof creatures.$inferInsert;

const syncSchema = z.object({
    tabId: z.coerce
        .number()
        .int()
        .min(0, 'Tab ID must be 0 or a positive number.')
        .max(99999, 'Tab ID must be 5 digits long or fewer'),
});

const tfoErrorMap: { [key: number]: string } = {
    1: 'User does not exist.',
    2: "User's lab is hidden.",
    5: 'Invalid API call. This may be a temporary issue.',
    7: 'Tab does not exist.',
    8: 'Tab is hidden.',
};

export async function POST(req: Request) {
    Sentry.captureMessage('Syncing creatures from TFO tab', 'log');
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        Sentry.captureMessage('Unauthenticated attempt to sync creatures', 'log');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!process.env.TFO_API_KEY) {
        console.error('CRITICAL: TFO_API_KEY is not set in the environment variables.');
        Sentry.captureException(
            new Error('CRITICAL: TFO_API_KEY is not set in the environment variables.')
        );
        return NextResponse.json(
            { error: 'Server configuration error. Contact administrator.' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const validated = syncSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            Sentry.captureMessage(`Invalid data for syncing creatures. ${errorMessage}`, 'log');
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { tabId } = validated.data;
        const username = session.user.username;
        const tfoApiUrl = `https://finaloutpost.net/api/v1/tab/${tabId}/${username}`;
        const response = await fetch(tfoApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiKey': process.env.TFO_API_KEY,
            },
        });
        if (!response.ok) {
            throw new Error(`TFO API responded with status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        if (data.error === true) {
            const errorMessage =
                tfoErrorMap[data.errorCode] || 'An unknown error occurred with the TFO API.';
            Sentry.captureMessage(`TFO API error during sync: ${errorMessage}`, 'error');
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }
        if (data.error || !data.creatures || data.creatures.length === 0) {
            Sentry.captureMessage('No creatures found in TFO tab during sync.', 'info');
            return NextResponse.json(
                {
                    error: 'No creatures were found with that tab ID. Make sure the tab is public, that it belongs to you, and that you have creatures on that tab.',
                },
                { status: 400 }
            );
        }

        const creatureValuesToUpdate: CreatureInsert[] = [];
        let updatedImageCount = 0;

        for (const tfoCreature of data.creatures) {
            const existingCreature = await db.query.creatures.findFirst({
                where: and(eq(creatures.code, tfoCreature.code), eq(creatures.userId, userId)),
            });
            let newImageUrl = existingCreature?.imageUrl || tfoCreature.imgsrc;

            const hasGrown =
                existingCreature && existingCreature.growthLevel !== tfoCreature.growthLevel;
            const isOldTfoUrl = newImageUrl && !newImageUrl.includes('vercel-storage.com');
            if (hasGrown || isOldTfoUrl) {
                console.log(
                    `Updating image for ${tfoCreature.code} because ${
                        hasGrown ? 'it grew' : 'it has an old URL'
                    }.`
                );
                try {
                    newImageUrl = await fetchAndUploadWithRetry(
                        tfoCreature.imgsrc,
                        tfoCreature.code
                    );
                    updatedImageCount++;
                } catch (uploadError) {
                    console.error(
                        `Failed to update image for ${tfoCreature.code}:`,
                        uploadError?.toString()
                    );
                    newImageUrl = tfoCreature.imgsrc;
                }
            }
            creatureValuesToUpdate.push({
                userId: userId,
                code: tfoCreature.code,
                creatureName: tfoCreature.name,
                imageUrl: newImageUrl,
                gottenAt: tfoCreature.gotten ? new Date(tfoCreature.gotten * 1000) : null,
                growthLevel: tfoCreature.growthLevel,
                isStunted: tfoCreature.isStunted,
                species: tfoCreature.breedName?.trim(),
                genetics: tfoCreature.genetics,
                gender: tfoCreature.gender.toLowerCase(),
                updatedAt: new Date(),
            });
        }
        if (creatureValuesToUpdate.length > 0) {
            await db
                .insert(creatures)
                .values(creatureValuesToUpdate)
                .onConflictDoUpdate({
                    target: [creatures.userId, creatures.code],
                    set: {
                        creatureName: sql`excluded.name`,
                        imageUrl: sql`excluded.imgsrc`,
                        growthLevel: sql`excluded.growth_level`,
                        isStunted: sql`excluded.is_stunted`,
                        species: sql`excluded.breed_name`,
                        genetics: sql`excluded.genetics`,
                        gender: sql`excluded.gender`,
                        gottenAt: sql`excluded.gotten_at`,
                        updatedAt: new Date(),
                    },
                });
        }

        const successMessage = `Successfully synced ${creatureValuesToUpdate.length} creatures. Updated ${updatedImageCount} images.`;
        Sentry.captureMessage(successMessage, 'info');
        revalidatePath('/collection');
        return NextResponse.json(
            {
                message: successMessage,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Creature sync failed:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
