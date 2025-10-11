import { db } from '@/src/db';
import { breedingPairs, breedingLogEntries, creatures } from '@/src/db/schema';
import { and, eq, or, inArray } from 'drizzle-orm';
import type { DbBreedingPair, DbBreedingLogEntry } from '@/types';

export async function getCreatureAncestors(creatureId: string, userId: string): Promise<string[]> {
    const ancestors = new Set<string>();
    const queue: string[] = [creatureId];
    const processed = new Set<string>();

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId || processed.has(currentId)) {
            continue;
        }
        processed.add(currentId);

        const logEntry = await db.query.breedingLogEntries.findFirst({
            where: and(
                eq(breedingLogEntries.userId, userId),
                or(
                    eq(breedingLogEntries.progeny1Id, currentId),
                    eq(breedingLogEntries.progeny2Id, currentId)
                )
            ),
        });

        if (logEntry) {
            const pair = await db.query.breedingPairs.findFirst({
                where: and(eq(breedingPairs.userId, userId), eq(breedingPairs.id, logEntry.pairId)),
            });

            if (pair) {
                if (pair.maleParentId) {
                    ancestors.add(pair.maleParentId);
                    queue.push(pair.maleParentId);
                }
                if (pair.femaleParentId) {
                    ancestors.add(pair.femaleParentId);
                    queue.push(pair.femaleParentId);
                }
            }
        }
    }
    return Array.from(ancestors);
}

export async function calculateGeneration(
    creatureId: string,
    allPairs: DbBreedingPair[],
    allLogs: DbBreedingLogEntry[]
): Promise<number | null> {
    const logEntry = allLogs.find(
        (log) => log.progeny1Id === creatureId || log.progeny2Id === creatureId
    );
    if (!logEntry) return null;

    const parentPair =
        (allPairs.find((pair) => pair.id === logEntry.pairId) as DbBreedingPair) || null;

    if (!parentPair) return null;

    const maleParent = await db.query.creatures.findFirst({
        where: eq(creatures.id, parentPair.maleParentId!),
    });
    const maleParentGen = maleParent?.generation ?? 1;

    const femaleParent = await db.query.creatures.findFirst({
        where: eq(creatures.id, parentPair.femaleParentId!),
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

    const initialGeneration = await calculateGeneration(startCreatureId, allPairs, allLogs);
    if (initialGeneration !== null) {
        await db
            .update(creatures)
            .set({ generation: initialGeneration })
            .where(and(eq(creatures.id, startCreatureId), eq(creatures.userId, userId)));
    }

    while (creaturesToUpdate.size > 0) {
        const currentCreatureId = creaturesToUpdate.values().next().value || '';
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
                        eq(breedingPairs.maleParentId, currentCreatureId!),
                        eq(breedingPairs.femaleParentId, currentCreatureId!)
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

        const progenyIds = progenyLogs
            .flatMap((log) => [log.progeny1Id, log.progeny2Id])
            .filter((id): id is string => !!id);

        progenyIds.forEach((id) => creaturesToUpdate.add(id));
    }
}
