import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { fetchAndUploadWithRetry } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';

type CreatureInsert = typeof creatures.$inferInsert;

const tfoErrorMap: { [key: number]: string } = {
    1: 'User does not exist.',
    2: "User's lab is hidden.",
    5: 'Invalid API call. This may be a temporary issue.',
    7: 'Tab does not exist.',
    8: 'Tab is hidden.',
};

const syncAllSchema = z.object({
    tabIds: z.array(z.number().int().min(0)),
    fullSync: z.boolean().optional(),
});

async function syncTab(
    tabId: number,
    userId: string,
    username: string,
    tfoApiKey: string
): Promise<{ syncedCreatures: CreatureInsert[]; tfoCreatureCodes: string[] }> {
    const BATCH_SIZE = 500;
    let page = 1;
    let hasMore = true;
    const allCreaturesToUpdate: CreatureInsert[] = [];
    const allTfoCreatureCodes: string[] = [];

    while (hasMore) {
        const tfoApiUrl = `https://finaloutpost.net/api/v1/tab/${tabId}/${username}?page=${page}`;
        const response = await fetch(tfoApiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'apiKey': tfoApiKey },
        });

        if (!response.ok) {
            console.error(
                `TFO API responded with status: ${response.status} for tab ${tabId}, page ${page}`
            );
            hasMore = false; // Stop trying on error
            continue;
        }

        const data = await response.json();
        if (data.error === true) {
            const errorMessage =
                tfoErrorMap[data.errorCode] ||
                `An unknown error with the TFO API for tab ${tabId}.`;
            console.error(errorMessage);
            hasMore = false; // Stop trying on error
            continue;
        }

        if (!data.creatures || data.creatures.length === 0) {
            hasMore = false; // No more creatures
            continue;
        }

        const tfoCreatures = data.creatures;

        for (const tfoCreature of tfoCreatures) {
            allTfoCreatureCodes.push(tfoCreature.code);
            const existingCreature = await db.query.creatures.findFirst({
                where: and(eq(creatures.code, tfoCreature.code), eq(creatures.userId, userId)),
            });
            let newImageUrl = existingCreature?.imageUrl || tfoCreature.imgsrc;

            const hasGrown =
                existingCreature && existingCreature.growthLevel !== tfoCreature.growthLevel;
            const isOldTfoUrl = newImageUrl && !newImageUrl.includes('vercel-storage.com');

            if ((hasGrown || isOldTfoUrl) && tfoCreature.imgsrc) {
                try {
                    newImageUrl = await fetchAndUploadWithRetry(
                        tfoCreature.imgsrc,
                        tfoCreature.code
                    );
                } catch (uploadError) {
                    console.error(
                        `Failed to update image for ${tfoCreature.code}:`,
                        uploadError?.toString()
                    );
                    newImageUrl = tfoCreature.imgsrc;
                }
            }
            allCreaturesToUpdate.push({
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
                isArchived: false, // Un-archive if it's found again
            });
        }

        if (tfoCreatures.length < BATCH_SIZE) {
            hasMore = false; // This was the last page
        } else {
            page++; // There might be more pages
        }
    }

    await logUserAction({
        action: 'sync.run',
        description: `Synced TFO tab ${tabId}. Updated ${allCreaturesToUpdate.length} creatures across ${page} page(s).`,
    });

    return { syncedCreatures: allCreaturesToUpdate, tfoCreatureCodes: allTfoCreatureCodes };
}

export async function POST(req: Request) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || !session.user.username) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const tfoApiKey = process.env.TFO_API_KEY;
    if (!tfoApiKey) {
        console.error('CRITICAL: TFO_API_KEY is not set.');
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const validated = syncAllSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed in creature sync', { fieldErrors });
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { tabIds, fullSync } = validated.data;
        const username = session.user.username;

        const allSyncPromises = tabIds.map((tabId) => syncTab(tabId, userId, username, tfoApiKey));
        const allSyncResults = await Promise.all(allSyncPromises);

        const allCreaturesToUpdate = allSyncResults.flatMap((r) => r.syncedCreatures);
        const allTfoCreatureCodes = allSyncResults.flatMap((r) => r.tfoCreatureCodes);

        if (allCreaturesToUpdate.length > 0) {
            await db
                .insert(creatures)
                .values(allCreaturesToUpdate)
                .onConflictDoUpdate({
                    target: [creatures.userId, creatures.code],
                    set: {
                        creatureName: sql`excluded.creature_name`,
                        imageUrl: sql`excluded.image_url`,
                        growthLevel: sql`excluded.growth_level`,
                        isStunted: sql`excluded.is_stunted`,
                        species: sql`excluded.species`,
                        genetics: sql`excluded.genetics`,
                        gender: sql`excluded.gender`,
                        gottenAt: sql`excluded.gotten_at`,
                        updatedAt: new Date(),
                        isArchived: false,
                    },
                });
        }

        let missingCreatures: { id: string; code: string; creatureName: string | null }[] = [];
        if (fullSync && allTfoCreatureCodes.length > 0) {
            // Find creatures in the DB that are not archived and not in the list from TFO
            const dbCreatures = await db
                .select({
                    id: creatures.id,
                    code: creatures.code,
                    creatureName: creatures.creatureName,
                })
                .from(creatures)
                .where(
                    and(
                        eq(creatures.userId, userId),
                        eq(creatures.isArchived, false),
                        notInArray(creatures.code, allTfoCreatureCodes)
                    )
                );
            missingCreatures = dbCreatures;
        }

        revalidatePath('/collection');

        return NextResponse.json({
            message: `Successfully synced ${allCreaturesToUpdate.length} creatures.`,
            missingCreatures,
        });
    } catch (error) {
        console.error('Creature sync-all failed:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
