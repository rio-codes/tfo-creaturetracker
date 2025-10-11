import { db } from '@/src/db';
import { breedingPairs, breedingLogEntries, creatures } from '@/src/db/schema';
import { and, eq, or, inArray } from 'drizzle-orm';
import type { DbBreedingPair, DbBreedingLogEntry, Creature } from '@/types';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type TransactionDB =
    | PostgresJsDatabase<Record<string, unknown>>
    | NodePgDatabase<Record<string, unknown>>;

export function calculateGeneration(
    creatureId: string,
    allPairs: DbBreedingPair[],
    allLogs: DbBreedingLogEntry[]
): number | null {
    const logEntry = allLogs.find(
        (log) => log.progeny1Id === creatureId || log.progeny2Id === creatureId
    );
    if (!logEntry) return null;

    const parentPair = allPairs.find((pair) => pair.id === logEntry.pairId);
    if (!parentPair) return null;

    const maleParentGen =
        allPairs.find((p) => p.maleParentId === parentPair.maleParentId)?.maleParent?.generation ??
        1;
    const femaleParentGen =
        allPairs.find((p) => p.femaleParentId === parentPair.femaleParentId)?.femaleParent
            ?.generation ?? 1;

    return Math.max(maleParentGen, femaleParentGen) + 1;
}

export async function updateDescendantGenerations(
    startCreatureId: string,
    userId: string,
    tx: TransactionDB
) {
    const creaturesToUpdate = new Set<string>([startCreatureId]);
    const processedCreatures = new Set<string>();

    while (creaturesToUpdate.size > 0) {
        const currentCreatureId = creaturesToUpdate.values().next().value;
        creaturesToUpdate.delete(currentCreatureId);

        if (processedCreatures.has(currentCreatureId)) {
            continue;
        }
        processedCreatures.add(currentCreatureId);

        // Find pairs where this creature is a parent
        const childPairs = await tx
            .select({ id: breedingPairs.id })
            .from(breedingPairs)
            .where(
                and(
                    eq(breedingPairs.userId, userId),
                    or(
                        eq(breedingPairs.maleParentId, currentCreatureId),
                        eq(breedingPairs.femaleParentId, currentCreatureId)
                    )
                )
            );

        if (childPairs.length === 0) continue;

        const childPairIds = childPairs.map((p) => p.id);

        // Find all progeny from those pairs
        const progenyLogs = await tx.query.breedingLogEntries.findMany({
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
