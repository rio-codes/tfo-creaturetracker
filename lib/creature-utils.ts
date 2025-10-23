import { db } from '@/src/db';
import { breedingPairs, breedingLogEntries, creatures } from '@/src/db/schema';
import { and, eq, or, inArray } from 'drizzle-orm';
import type { DbBreedingPair, DbBreedingLogEntry } from '@/types';

type CreatureKey = { userId: string; code: string };

export async function getCreatureAncestors(
    creatureKey: CreatureKey,
    userId: string
): Promise<CreatureKey[]> {
    const ancestors = new Set<string>(); // Stores composite keys as "userId-code"
    const queue: CreatureKey[] = [creatureKey];
    const processed = new Set<string>();

    while (queue.length > 0) {
        const currentKey = queue.shift();
        if (!currentKey) continue;

        const compositeKey = `${currentKey.userId}-${currentKey.code}`;
        if (processed.has(compositeKey)) {
            continue;
        }
        processed.add(compositeKey);

        const logEntry = await db.query.breedingLogEntries.findFirst({
            where: and(
                eq(breedingLogEntries.userId, userId),
                or(
                    and(
                        eq(breedingLogEntries.progeny1UserId, currentKey.userId),
                        eq(breedingLogEntries.progeny1Code, currentKey.code)
                    ),
                    and(
                        eq(breedingLogEntries.progeny2UserId, currentKey.userId),
                        eq(breedingLogEntries.progeny2Code, currentKey.code)
                    )
                )
            ),
        });

        if (logEntry) {
            const pair = await db.query.breedingPairs.findFirst({
                where: eq(breedingPairs.id, logEntry.pairId),
            });

            if (pair) {
                if (pair.maleParentUserId && pair.maleParentCode) {
                    const maleKey = { userId: pair.maleParentUserId, code: pair.maleParentCode };
                    ancestors.add(`${maleKey.userId}-${maleKey.code}`);
                    queue.push(maleKey);
                }
                if (pair.femaleParentUserId && pair.femaleParentCode) {
                    const femaleKey = {
                        userId: pair.femaleParentUserId,
                        code: pair.femaleParentCode,
                    };
                    ancestors.add(`${femaleKey.userId}-${femaleKey.code}`);
                    queue.push(femaleKey);
                }
            }
        }
    }
    return Array.from(ancestors).map((key) => {
        const [userId, code] = key.split('-');
        return { userId, code };
    });
}

export async function calculateGeneration(
    creatureKey: CreatureKey,
    allPairs: DbBreedingPair[],
    allLogs: DbBreedingLogEntry[]
): Promise<number | null> {
    const logEntry = allLogs.find(
        (log) =>
            (log.progeny1UserId === creatureKey.userId && log.progeny1Code === creatureKey.code) ||
            (log.progeny2UserId === creatureKey.userId && log.progeny2Code === creatureKey.code)
    );
    if (!logEntry) return null;

    const parentPair = allPairs.find((pair) => pair.id === logEntry.pairId) || null;

    if (!parentPair) return null;

    const maleParent = await db.query.creatures.findFirst({
        where: and(
            eq(creatures.userId, parentPair.maleParentUserId),
            eq(creatures.code, parentPair.maleParentCode)
        ),
    });
    const maleParentGen = maleParent?.generation ?? 1;

    const femaleParent = await db.query.creatures.findFirst({
        where: and(
            eq(creatures.userId, parentPair.femaleParentUserId),
            eq(creatures.code, parentPair.femaleParentCode)
        ),
    });
    const femaleParentGen = femaleParent?.generation ?? 1;

    return Math.max(maleParentGen, femaleParentGen) + 1;
}

export async function updateDescendantGenerations(startCreatureId: string, userId: string) {
    const creaturesToUpdate = new Set<string>([startCreatureId]);
    const processedCreatures = new Set<string>();

    const allPairs = await db.query.breedingPairs.findMany({
        where: eq(breedingPairs.userId, userId),
    });
    const allLogs = await db.query.breedingLogEntries.findMany({
        where: eq(breedingLogEntries.userId, userId),
    });
    const startCreature = await db.query.creatures.findFirst({
        where: and(eq(creatures.id, startCreatureId), eq(creatures.userId, userId)),
    });

    const initialGeneration = startCreature
        ? await calculateGeneration(
              { userId: startCreature.userId, code: startCreature.code },
              allPairs,
              allLogs
          )
        : null;
    if (initialGeneration !== null) {
        await db
            .update(creatures)
            .set({ generation: initialGeneration })
            .where(and(eq(creatures.id, startCreatureId), eq(creatures.userId, userId)));
    }

    while (creaturesToUpdate.size > 0) {
        const currentCreatureId = creaturesToUpdate.values().next().value || '';
        const currentCreature = await db.query.creatures.findFirst({
            where: eq(creatures.id, currentCreatureId),
        });
        if (!currentCreature) continue;

        creaturesToUpdate.delete(currentCreatureId);

        if (processedCreatures.has(currentCreatureId)) {
            continue;
        }
        processedCreatures.add(currentCreatureId);

        // Find pairs where this creature is a parent
        const childPairs = await db
            .select({ id: breedingPairs.id })
            .from(breedingPairs)
            .where(
                and(
                    eq(breedingPairs.userId, userId),
                    or(
                        and(
                            eq(breedingPairs.maleParentUserId, currentCreature.userId),
                            eq(breedingPairs.maleParentCode, currentCreature.code)
                        ),
                        and(
                            eq(breedingPairs.femaleParentUserId, currentCreature.userId),
                            eq(breedingPairs.femaleParentCode, currentCreature.code)
                        )
                    )
                )
            );

        if (childPairs.length === 0) continue;

        const childPairIds = childPairs.map((p) => p.id);

        // Find all progeny from those pairs
        const progenyLogs = await db.query.breedingLogEntries.findMany({
            where: and(
                eq(breedingLogEntries.userId, userId),
                inArray(breedingLogEntries.pairId, childPairIds)
            ),
        });

        const progenyKeys = progenyLogs.flatMap((log) => {
            const keys: { userId: string; code: string }[] = [];
            if (log.progeny1UserId && log.progeny1Code)
                keys.push({ userId: log.progeny1UserId, code: log.progeny1Code });
            if (log.progeny2UserId && log.progeny2Code)
                keys.push({ userId: log.progeny2UserId, code: log.progeny2Code });
            return keys;
        });

        const progenyCreatures = await db
            .select({ id: creatures.id })
            .from(creatures)
            .where(
                or(
                    ...progenyKeys.map((k) =>
                        and(eq(creatures.userId, k.userId), eq(creatures.code, k.code))
                    )
                )
            );

        progenyCreatures.forEach((c) => creaturesToUpdate.add(c.id));
    }
}
