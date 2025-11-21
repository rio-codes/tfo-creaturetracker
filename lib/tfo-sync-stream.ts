import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { fetchAndUploadWithRetry } from '@/lib/data';
import { structuredGeneData } from '@/constants/creature-data';
import { SyncGeneratorResult } from '@/types';

type CreatureInsert = typeof creatures.$inferInsert;

const tfoErrorMap: { [key: number]: string } = {
    1: 'User does not exist.',
    2: "User's lab is hidden.",
    5: 'Invalid API call. This may be a temporary issue.',
    7: 'Tab does not exist.',
    8: 'Tab is hidden.',
};

type TfoCreature = {
    code: string;
    name: string;
    imgsrc: string;
    gotten: number | null;
    growthLevel: number;
    isStunted: boolean;
    breedName: string;
    genetics: string;
    gender: string;
};

export async function* syncTfoTabsAndStream(
    userId: string,
    username: string,
    tabs: { tabId: number; tabName: string | null }[],
    tfoApiKey: string
): AsyncGenerator<SyncGeneratorResult> {
    const allTfoCreatureCodes: string[] = [];

    for (const [index, tab] of tabs.entries()) {
        yield {
            type: 'tab-start',
            data: {
                tabName: tab.tabName || `Tab ${tab.tabId}`,
                current: index + 1,
                total: tabs.length,
            },
        };

        try {
            const tfoApiUrl = `https://finaloutpost.net/api/v1/tab/${tab.tabId}/${username}`;
            const response = await fetch(tfoApiUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'apiKey': tfoApiKey },
            });

            if (!response.ok) {
                throw new Error(`TFO API responded with status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error === true) {
                const errorMessage =
                    tfoErrorMap[data.errorCode] || 'An unknown error occurred with the TFO API.';
                throw new Error(`Tab ${tab.tabId}: ${errorMessage}`);
            }

            const tfoCreatures: TfoCreature[] = data.creatures;
            if (!tfoCreatures || tfoCreatures.length === 0) {
                yield {
                    type: 'tab-progress',
                    data: {
                        message: 'No creatures found on this tab.',
                        progress: 100,
                    },
                };
                continue;
            }

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

            for (const [creatureIndex, tfoCreature] of tfoCreatures.entries()) {
                allTfoCreatureCodes.push(tfoCreature.code);
                const existingCreature = existingCreatureMap.get(tfoCreature.code);
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
                            uploadError
                        );
                        // Keep old image on failure
                    }
                }

                const geneticsObject: { [key: string]: { genotype: string; phenotype: string } } =
                    {};
                const speciesGeneData = structuredGeneData[tfoCreature.breedName?.trim() || ''];

                if (
                    speciesGeneData &&
                    tfoCreature.growthLevel >= 3 &&
                    !(speciesGeneData as any).hasNoGenetics
                ) {
                    tfoCreature.genetics.split(',').forEach((part) => {
                        const [category, genotype] = part.split(':');
                        if (category && genotype) {
                            const categoryData = (speciesGeneData as any)[category] as
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

                const creatureData: CreatureInsert = {
                    userId: userId,
                    code: tfoCreature.code,
                    creatureName: tfoCreature.name,
                    imageUrl: newImageUrl,
                    gottenAt: tfoCreature.gotten ? new Date(tfoCreature.gotten * 1000) : null,
                    growthLevel: tfoCreature.growthLevel,
                    isStunted: tfoCreature.isStunted,
                    species: tfoCreature.breedName?.trim(), // This is correct
                    genetics: JSON.stringify(geneticsObject),
                    gender: tfoCreature.gender as
                        | 'male'
                        | 'female'
                        | 'genderless'
                        | 'Unknown'
                        | null
                        | undefined,
                    updatedAt: new Date(),
                    isArchived: false,
                };

                await db
                    .insert(creatures)
                    .values(creatureData)
                    .onConflictDoUpdate({
                        target: [creatures.userId, creatures.code],
                        set: creatureData,
                    });

                yield {
                    type: 'tab-progress',
                    data: {
                        message: `Synced: ${tfoCreature.name || tfoCreature.code}`,
                        progress: ((creatureIndex + 1) / tfoCreatures.length) * 100,
                    },
                };
            }
        } catch (error: any) {
            if (error instanceof Error && error.message.includes('network error')) {
                continue;
            } else {
                console.error('Streaming sync failed:', error);
                yield {
                    type: 'error',
                    data: { message: 'An internal server error occurred.' },
                };
            }
        }
    }

    yield {
        type: 'done',
        data: {
            message: 'Sync complete!',
        },
    };
}
