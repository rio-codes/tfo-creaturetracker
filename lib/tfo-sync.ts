import { db } from "@/src/db";
import { creatures, userTabs } from "@/src/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { fetchAndUploadWithRetry } from "@/lib/data";

// This is a simplified representation of the TFO API response
type TfoCreature = {
    code: string;
    name: string;
    species: string;
    gender: 'male' | 'female';
    growth: number;
    genetics: string;
    image: string;
    gotten: string; // date string
};

async function fetchCreaturesFromTfo(tfoUsername: string, tabId: number): Promise<TfoCreature[]> {
    const url = `https://finaloutpost.net/c/all/${tfoUsername}/${tabId}/`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch data from TFO for tab ${tabId}. Is the tab public?`);
    }
    const data = await response.json();
    if (!data || data.length === 0) {
        throw new Error(`No creatures found on tab ${tabId}. Is the tab public and not empty?`);
    }
    return data;
}

export async function syncTfoTab(userId: string, tfoUsername: string, tabId: number) {
    const tfoCreatures = await fetchCreaturesFromTfo(tfoUsername, tabId);

    const existingCreatures = await db.query.creatures.findMany({
        where: and(
            eq(creatures.userId, userId),
            inArray(creatures.code, tfoCreatures.map(c => c.code))
        )
    });

    const existingCreatureMap = new Map(existingCreatures.map(c => [c.code, c]));
    let added = 0;
    let updated = 0;

    for (const tfoCreature of tfoCreatures) {
        const existingCreature = existingCreatureMap.get(tfoCreature.code);
        const imageUrl = await fetchAndUploadWithRetry(tfoCreature.image, tfoCreature.code);

        const creatureData = { userId, code: tfoCreature.code, creatureName: tfoCreature.name, species: tfoCreature.species, imageUrl, gender: tfoCreature.gender, growthLevel: tfoCreature.growth, genetics: tfoCreature.genetics, gottenAt: new Date(tfoCreature.gotten), updatedAt: new Date() };

        if (existingCreature) {
            await db.update(creatures).set(creatureData).where(eq(creatures.id, existingCreature.id));
            updated++;
        } else {
            await db.insert(creatures).values({ ...creatureData, id: tfoCreature.code, createdAt: new Date() });
            added++;
        }
    }

    // Add tab to user's list if it's not there
    const existingTab = await db.query.userTabs.findFirst({ where: and(eq(userTabs.userId, userId), eq(userTabs.tabId, tabId)) });
    if (!existingTab) {
        await db.insert(userTabs).values({ userId, tabId, tabName: `Tab ${tabId}` });
    }

    return { added, updated };
}
