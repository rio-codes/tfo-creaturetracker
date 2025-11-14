import dotenv from 'dotenv';
if (process.env.NODE_ENV === 'development') {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

async function cleanupGenetics() {
    console.log('Starting genetics cleanup...');
    try {
        const allCreatures = await db.select().from(creatures);
        let updatedCount = 0;

        for (const creature of allCreatures) {
            if (creature.genetics === '[object Object]') {
                console.log(`Found invalid genetics for creature ${creature.code}. Updating...`);
                await db
                    .update(creatures)
                    .set({ genetics: '{}' })
                    .where(eq(creatures.id, creature.id));
                updatedCount++;
            }
        }

        console.log(`Cleanup complete. Updated ${updatedCount} creatures.`);
    } catch (error) {
        console.error('An error occurred during genetics cleanup:', error);
    }
}

cleanupGenetics().finally(() => {
    console.log('Script finished.');
    process.exit(0);
});
