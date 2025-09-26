import type { DbBreedingPair, DbBreedingLogEntry } from '@/types';

export function calculateGeneration(
    creatureId: string,
    allPairs: DbBreedingPair[],
    allLogs: DbBreedingLogEntry[],
    memo: Map<string, number> = new Map()
): number {
    if (memo.has(creatureId)) {
        return memo.get(creatureId)!;
    }

    const logEntry = allLogs.find(
        (log) => log.progeny1Id === creatureId || log.progeny2Id === creatureId
    );
    if (!logEntry || !logEntry.pairId) {
        memo.set(creatureId, 1);
        return 1;
    }

    const parentPair = allPairs.find((pair) => pair.id === logEntry.pairId);
    if (!parentPair || !parentPair.maleParentId || !parentPair.femaleParentId) {
        memo.set(creatureId, 1);
        return 1;
    }

    const maleParentMock = { id: parentPair.maleParentId, manualGeneration: null };
    const femaleParentMock = { id: parentPair.femaleParentId, manualGeneration: null };

    const maleGen = calculateGeneration(maleParentMock.id, allPairs, allLogs, memo);
    const femaleGen = calculateGeneration(femaleParentMock.id, allPairs, allLogs, memo);

    const generation = 1 + Math.max(maleGen, femaleGen);
    memo.set(creatureId, generation);
    return generation;
}
