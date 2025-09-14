import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
    auditLog,
    users,
    creatures,
    breedingPairs,
    researchGoals,
    userTabs,
} from '../src/db/schema';
import { inArray, eq } from 'drizzle-orm';

async function cleanupAuditLog() {
    console.log('Starting audit log backfill and cleanup...');

    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
        throw new Error('POSTGRES_URL environment variable is not set.');
    }

    const sql = postgres(connectionString, {
        ssl: 'require',
        max: 1, // This is a single-use script, no need for a connection pool.
    });

    const db = drizzle(sql);

    try {
        await db.transaction(async (tx) => {
            console.log('Fetching all audit logs and users...');
            const [allLogs, allUsers] = await Promise.all([
                tx.select().from(auditLog),
                tx.select({ id: users.id, username: users.username }).from(users),
            ]);
            console.log(`Found ${allLogs.length} log entries and ${allUsers.length} users.`);

            const userMap = new Map(allUsers.map((u) => [u.id, u.username]));
            const idsToDelete = new Set<string>();
            const updates: {
                id: string;
                targetUserId: string | null;
                targetUsername: string | null;
            }[] = [];

            // Separate logs that have targetUserId from those that don't
            const logsWithTargetId = allLogs.filter((log) => log.targetUserId);
            const logsWithoutTargetId = allLogs.filter((log) => !log.targetUserId);

            // --- Phase 1: Process logs that already have a targetUserId ---
            console.log(
                `\nPhase 1: Processing ${logsWithTargetId.length} entries with existing targetUserId...`
            );
            for (const log of logsWithTargetId) {
                if (log.adminId === log.targetUserId) {
                    idsToDelete.add(log.id);
                } else {
                    const targetUsername = userMap.get(log.targetUserId!) ?? null;
                    // Only update if username is missing or incorrect
                    if (log.targetUsername !== targetUsername) {
                        updates.push({
                            id: log.id,
                            targetUserId: log.targetUserId!,
                            targetUsername,
                        });
                    }
                }
            }

            // --- Phase 2: Process older logs without a targetUserId ---
            console.log(
                `\nPhase 2: Processing ${logsWithoutTargetId.length} entries without targetUserId...`
            );
            if (logsWithoutTargetId.length > 0) {
                const logsByTargetType: Record<string, (typeof logsWithoutTargetId)[number][]> = {};
                for (const log of logsWithoutTargetId) {
                    if (log.targetType) {
                        if (!logsByTargetType[log.targetType]) {
                            logsByTargetType[log.targetType] = [];
                        }
                        logsByTargetType[log.targetType].push(log);
                    }
                }

                // Handle 'user' type directly
                if (logsByTargetType['user']) {
                    for (const log of logsByTargetType['user']) {
                        const targetUserId = log.targetId;
                        if (!targetUserId) continue;

                        if (log.adminId === targetUserId) {
                            idsToDelete.add(log.id);
                        } else {
                            const targetUsername = userMap.get(targetUserId) ?? null;
                            updates.push({ id: log.id, targetUserId, targetUsername });
                        }
                    }
                }

                // Helper to process other item types
                const processTargetType = async (type: string, table: any, isNumericId = false) => {
                    const logs = logsByTargetType[type];
                    if (!logs || logs.length === 0) return;

                    console.log(`  - Analyzing ${logs.length} '${type}' entries...`);
                    const targetIds = logs
                        .map((log) => (isNumericId ? parseInt(log.targetId!, 10) : log.targetId!))
                        .filter((id) => (isNumericId ? !isNaN(id as number) : !!id));

                    if (targetIds.length === 0) return;

                    const items = await tx
                        .select({ id: table.id, userId: table.userId })
                        .from(table)
                        .where(inArray(table.id, targetIds as any));

                    const itemOwnerMap = new Map(items.map((item) => [item.id, item.userId]));

                    for (const log of logs) {
                        const targetId = isNumericId ? parseInt(log.targetId!, 10) : log.targetId!;
                        const ownerId = itemOwnerMap.get(targetId);

                        if (ownerId) {
                            if (log.adminId === ownerId) {
                                idsToDelete.add(log.id);
                            } else {
                                const targetUsername = userMap.get(ownerId) ?? null;
                                updates.push({ id: log.id, targetUserId: ownerId, targetUsername });
                            }
                        } else {
                            // This means the item was likely deleted. We can't determine the owner.
                            // We'll mark the username as such, but we can't determine if it was a self-action.
                            // We only update if the username isn't already set to avoid re-processing.
                            if (!log.targetUsername) {
                                updates.push({
                                    id: log.id,
                                    targetUserId: null,
                                    targetUsername: '[Deleted Item]',
                                });
                            }
                            console.warn(
                                `    - Could not find owner for ${type} with id ${log.targetId} (log id: ${log.id}). Marking as deleted.`
                            );
                        }
                    }
                };

                await processTargetType('creature', creatures);
                await processTargetType('breeding_pair', breedingPairs);
                await processTargetType('research_goal', researchGoals);
                await processTargetType('user_tab', userTabs, true);
            }

            // --- Phase 3: Apply deletions and updates ---
            console.log('\nPhase 3: Applying changes to the database...');

            if (idsToDelete.size > 0) {
                console.log(`  - Deleting ${idsToDelete.size} self-action entries...`);
                await tx.delete(auditLog).where(inArray(auditLog.id, Array.from(idsToDelete)));
            } else {
                console.log('  - No entries to delete.');
            }

            if (updates.length > 0) {
                console.log(`  - Updating ${updates.length} entries with target user info...`);
                for (const update of updates) {
                    await tx
                        .update(auditLog)
                        .set({
                            targetUserId: update.targetUserId,
                            targetUsername: update.targetUsername,
                        })
                        .where(eq(auditLog.id, update.id));
                }
            } else {
                console.log('  - No entries to update.');
            }

            console.log('Transaction complete.');
        });
    } catch (error) {
        console.error('An error occurred during audit log backfill and cleanup:', error);
        process.exit(1);
    }
}

cleanupAuditLog().then(() => {
    console.log('\nScript finished.');
    process.exit(0);
});
