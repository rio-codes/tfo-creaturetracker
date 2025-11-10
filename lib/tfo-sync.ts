import { db } from '@/src/db';
import { creatures, userTabs } from '@/src/db/schema';
import { structuredGeneData } from '@/constants/creature-data';
import { eq, and, inArray } from 'drizzle-orm';
import { fetchAndUploadWithRetry } from '@/lib/data';

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

async function fetchCreaturesFromTfo(tfoUsername: string, tabId: number): Promise<TfoCreature[]> {
    const url = `https://finaloutpost.net/api/v1/tab/${tabId}/${tfoUsername}`;
    const apiKey = process.env.TFO_API_KEY;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'apiKey': `${apiKey}` },
    });
    if (!response.ok) {
        throw new Error(
            `TFO API responded with status: ${response.status}, ${response.statusText}`
        );
    }
    const data = await response.json();
    if (data.error === true) {
        const errorMessage =
            tfoErrorMap[data.errorCode] || 'An unknown error occurred with the TFO API.';
        throw new Error(errorMessage);
    }
    if (!data.creatures || data.creatures.length === 0) {
        const errorMessage =
            'No creatures were found with that tab ID. Make sure the tab is public, that it belongs to you, and that you have creatures on that tab.';
        throw new Error(errorMessage);
    }
    return data.creatures;
}

export async function syncTfoTab(userId: string, tfoUsername: string, tabId: number) {
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

    const existingCreatureMap = new Map(existingCreatures.map((c) => [c.code, c]));
    let added = 0;
    let updated = 0;

    for (const tfoCreature of tfoCreatures) {
        const existingCreature = existingCreatureMap.get(tfoCreature.code);
        let imageUrl = existingCreature?.imageUrl ?? ''; // Default to existing or empty string
        try {
            imageUrl = await fetchAndUploadWithRetry(tfoCreature.imgsrc, tfoCreature.code);
        } catch (error) {
            console.error(error);
            // If upload fails, we'll use the default value (old image or empty string)
        }

        const geneticsObject: NonNullable<CreatureInsert['genetics']> = {};
        const speciesGeneData = structuredGeneData[tfoCreature.breedName?.trim() || ''];

        if (speciesGeneData) {
            tfoCreature.genetics.split(',').forEach((part) => {
                const [category, genotype] = part.split(':');
                if (category && genotype) {
                    const categoryData = speciesGeneData[category] as
                        | { genotype: string; phenotype: string }[]
                        | undefined;
                    if (Array.isArray(categoryData)) {
                        const geneInfo = categoryData.find((g) => g.genotype === genotype);
                        geneticsObject[category] = {
                            genotype,
                            phenotype: geneInfo?.phenotype || 'Unknown',
                        };
                    }
                }
            });
        }

        const valuesToInsert: CreatureInsert = {
            userId: userId,
            code: tfoCreature.code,
            creatureName: tfoCreature.name,
            imageUrl: imageUrl,
            gottenAt: tfoCreature.gotten ? new Date(tfoCreature.gotten * 1000) : null,
            growthLevel: tfoCreature.growthLevel,
            isStunted: tfoCreature.isStunted,
            species: tfoCreature.breedName?.trim(),
            genetics: geneticsObject,
            gender: (tfoCreature.gender as 'male' | 'female' | 'Unknown' | null) || null,
        };
        await db
            .insert(creatures)
            .values(valuesToInsert)
            .onConflictDoUpdate({
                target: [creatures.userId, creatures.code],
                set: {
                    creatureName: valuesToInsert.creatureName,
                    imageUrl: valuesToInsert.imageUrl,
                    growthLevel: valuesToInsert.growthLevel,
                    isStunted: valuesToInsert.isStunted,
                    species: valuesToInsert.species,
                    genetics: valuesToInsert.genetics,
                    gender: valuesToInsert.gender,
                    gottenAt: valuesToInsert.gottenAt,
                },
            });

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
        await db.insert(userTabs).values({ userId, tabId, tabName: `Tab ${tabId}` });
    }

    return { added, updated };
}
