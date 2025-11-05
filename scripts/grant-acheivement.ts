// /scripts/grant-achievement.ts

import { db } from '../src/db'; // Note the path adjustment
import { users, achievements, userAchievements } from '../src/db/schema';
import { sql } from 'drizzle-orm';

// --- CUSTOMIZE YOUR ACHIEVEMENT HERE ---
const achievementDetails = {
    id: 'in-the-beginning',
    name: 'In The Beginning',
    description:
        'For being one of the first members of the TFO.ct community and surviving our first Hallowsnight.',
    type: 'event' as const,
    artist: 'Koda',
};
// -----------------------------------------

async function grantAchievementToAllUsers() {
    console.log('Starting achievement grant script...');

    try {
        console.log(`Upserting achievement: "${achievementDetails.name}"...`);
        await db
            .insert(achievements)
            .values(achievementDetails)
            .onConflictDoUpdate({
                target: achievements.id,
                set: {
                    name: achievementDetails.name,
                    description: achievementDetails.description,
                    type: achievementDetails.type,
                    artist: achievementDetails.artist,
                },
            });
        console.log('✅ Achievement definition saved successfully.');

        console.log('Fetching all users...');
        const allUsers = await db.select({ id: users.id }).from(users);
        console.log(`Found ${allUsers.length} users.`);

        if (allUsers.length === 0) {
            console.log('No users found. Exiting.');
            return;
        }

        const userAchievementsToInsert = allUsers.map((user) => ({
            userId: user.id,
            name: achievementDetails.name,
            achievementId: achievementDetails.id,
            achievedAt: new Date(),
            artist: achievementDetails.artist,
            description: achievementDetails.description,
        }));

        console.log(`Granting achievement to ${allUsers.length} users...`);
        await db.insert(userAchievements).values(userAchievementsToInsert).onConflictDoNothing();

        const countResult = await db
            .select({
                count: sql<number>`count(*)`,
            })
            .from(userAchievements)
            .where(sql`${userAchievements.achievementId} = ${achievementDetails.id}`);

        console.log(
            `✅ Verification complete. ${countResult[0].count} users now have the "${achievementDetails.name}" achievement.`
        );
        console.log('Script finished successfully!');
    } catch (error) {
        console.error('❌ An error occurred during the script execution:', error);
        process.exit(1);
    }
}

grantAchievementToAllUsers().then(() => {
    process.exit(0);
});
