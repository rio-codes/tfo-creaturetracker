/**
 * One-time script to clean up orphaned research goal IDs from breeding pairs.
 *
 * This script will:
 * 1. Fetch all existing research goal IDs.
 * 2. Fetch all breeding pairs that have goals assigned.
 * 3. For each pair, check if any of its assigned goal IDs no longer exist in the research_goals table.
 * 4. If orphaned IDs are found, it removes them from the pair's `assignedGoalIds` array and updates the record.
 *
 * To run this script:
 * 1. Make sure you have `tsx` or a similar tool installed: `npm install -g tsx`
 * 2. Execute the script from your project root: `tsx scripts/cleanup-orphaned-goals.ts`
 */
import 'dotenv/config';
import { db } from '@/src/db'; // Using path alias for robustness
import { breedingPairs, researchGoals } from '@/src/db/schema';
import { eq, isNotNull } from 'drizzle-orm';

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is not set.');
}

async function cleanupOrphanedGoals() {
    console.log('Starting cleanup of orphaned research goals from breeding pairs...');

    try {
        // 1. Fetch all existing research goal IDs to create a set for quick lookups.
        const existingGoals = await db.select({ id: researchGoals.id }).from(researchGoals);
        const existingGoalIds = new Set(existingGoals.map((g) => g.id));
        console.log(`Found ${existingGoalIds.size} existing research goals.`);

        // 2. Fetch all breeding pairs that have assigned goals.
        const pairsWithGoals = await db.query.breedingPairs.findMany({
            where: isNotNull(breedingPairs.assignedGoalIds),
        });

        console.log(`Found ${pairsWithGoals.length} breeding pairs with assigned goals to check.`);

        let updatedPairsCount = 0;

        // 3. Iterate through each pair and clean up its assigned goals.
        for (const pair of pairsWithGoals) {
            if (!pair.assignedGoalIds || pair.assignedGoalIds.length === 0) {
                continue;
            }

            const originalGoalIds = pair.assignedGoalIds;
            const cleanedGoalIds = originalGoalIds.filter((id) => existingGoalIds.has(id));

            // 4. If the list of IDs has changed, update the database record.
            if (cleanedGoalIds.length !== originalGoalIds.length) {
                console.log(`Updating pair "${pair.pairName}" (ID: ${pair.id}).`);
                console.log(
                    `  - Removed orphaned goal IDs: ${originalGoalIds.filter((id) => !existingGoalIds.has(id)).join(', ')}`
                );

                await db
                    .update(breedingPairs)
                    .set({ assignedGoalIds: cleanedGoalIds })
                    .where(eq(breedingPairs.id, pair.id));
                updatedPairsCount++;
            }
        }

        console.log('\n--- Cleanup Complete ---');
        console.log(`Total breeding pairs updated: ${updatedPairsCount}`);
        if (updatedPairsCount === 0) {
            console.log('No orphaned goals found. Your data is clean! ✨');
        }
    } catch (error) {
        console.error('An error occurred during the cleanup process:', error);
        process.exit(1);
    }
}

cleanupOrphanedGoals().then(() => {
    console.log('Script finished successfully.');
    process.exit(0);
});
