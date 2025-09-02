import { db } from '@/src/db';
import { creatures, userTabs } from '@/src/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { fetchAndUploadWithRetry } from '@/lib/data';
import * as Sentry from '@sentry/nextjs';

type CreatureInsert = typeof creatures.$inferInsert;

// This is a simplified representation of the TFO API response
type TfoCreature = {
    code: string;
    name: string;
    breedName: string;
    gender: 'male' | 'female' | 'unknown' | null | undefined;
    growthLevel: number; // TFO API returns number
    genetics: string;
    imgsrc: string;
    gotten: number | null;
    isStunted: boolean;
};

// TFO API error code mapping for user-friendly messages
const tfoErrorMap: { [key: number]: string } = {
    1: 'User does not exist.',
    2: "User's lab is hidden.",
    5: 'Invalid API call. This may be a temporary issue.',
    7: 'Tab does not exist.',
    8: 'Tab is hidden.',
};

async function fetchCreaturesFromTfo(
    tfoUsername: string,
    tabId: number
): Promise<TfoCreature[]> {
    const url = `https://finaloutpost.net/api/v1/tab/${tabId}/${tfoUsername}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            apiKey: process.env.TFO_API_KEY,
        },
    });
    if (!response.ok) {
        throw new Error(
            `TFO API responded with status: ${response.status}, ${response.statusText}`
        );
    }
    const data = await response.json();
    if (data.error === true) {
        const errorMessage =
            tfoErrorMap[data.errorCode] ||
            'An unknown error occurred with the TFO API.';
        Sentry.captureException(errorMessage);
        throw new Error(errorMessage);
    }
    if (!data.creatures || data.creatures.length === 0) {
        const errorMessage =
            'No creatures were found with that tab ID. Make sure the tab is public, that it belongs to you, and that you have creatures on that tab.';
        Sentry.captureException(errorMessage);
        throw new Error(errorMessage);
    }
    return data.creatures;
}

export async function syncTfoTab(
    userId: string,
    tfoUsername: string,
    tabId: number
) {
    const tfoCreatures = await fetchCreaturesFromTfo(tfoUsername, tabId);

    const existingCreatures = await db.query.creatures.findMany({
        where: and(
            eq(creatures.userId, userId),
            inArray(
                creatures.code,
                tfoCreatures.map((c) => c.code)
            )
        ),
    });

    const existingCreatureMap = new Map(
        existingCreatures.map((c) => [c.code, c])
    );
    let added = 0;
    let updated = 0;

    var imageUrl = '';

    for (const tfoCreature of tfoCreatures) {
        const existingCreature = existingCreatureMap.get(tfoCreature.code);
        try {
            imageUrl = await fetchAndUploadWithRetry(
                tfoCreature.imgsrc,
                tfoCreature.code
            );
        } catch (error) {
            Sentry.captureException(error);
        }

        const creatureValuesToUpdate: CreatureInsert[] = [];

        creatureValuesToUpdate.push({
            userId: userId,
            code: tfoCreature.code,
            creatureName: tfoCreature.name,
            imageUrl: imageUrl,
            gottenAt: tfoCreature.gotten
                ? new Date(tfoCreature.gotten * 1000)
                : null,
            growthLevel: tfoCreature.growthLevel,
            isStunted: tfoCreature.isStunted,
            species: tfoCreature.breedName?.trim(),
            genetics: tfoCreature.genetics,
            gender:
                (tfoCreature.gender?.toLowerCase() as
                    | 'male'
                    | 'female'
                    | 'unknown'
                    | null) || null,
            updatedAt: new Date(),
        });

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
        if (existingCreature) {
            updated++;
        } else {
            added++;
        }
    }

    // Add tab to user's list if it's not there
    const existingTab = await db.query.userTabs.findFirst({
        where: and(eq(userTabs.userId, userId), eq(userTabs.tabId, tabId)),
    });
    if (!existingTab) {
        await db
            .insert(userTabs)
            .values({ userId, tabId, tabName: `Tab ${tabId}` });
    }

    return { added, updated };
}
