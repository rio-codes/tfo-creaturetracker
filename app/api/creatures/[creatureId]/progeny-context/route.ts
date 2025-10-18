import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs, breedingLogEntries } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { enrichAndSerializeCreature, enrichAndSerializeBreedingPair } from '@/lib/serialization';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules';
import type { EnrichedBreedingPair } from '@/types';

export async function GET(request: Request, props: { params: Promise<{ creatureId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;
    const { creatureId } = params;

    try {
        const [creature, allUserLogs, allUserPairsRaw, allUserCreatures] = await Promise.all([
            db.query.creatures.findFirst({
                where: and(eq(creatures.id, creatureId), eq(creatures.userId, userId)),
            }),
            db.query.breedingLogEntries.findMany({ where: eq(breedingLogEntries.userId, userId) }),
            db.query.breedingPairs.findMany({
                where: and(eq(breedingPairs.userId, userId), eq(breedingPairs.isArchived, false)),
                with: {
                    maleParent: true,
                    femaleParent: true,
                },
            }),
            db.query.creatures.findMany({ where: eq(creatures.userId, userId) }),
        ]);

        if (!creature) {
            return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
        }

        const existingLogEntry = allUserLogs.find(
            (l) => l.progeny1Id === creatureId || l.progeny2Id === creatureId
        );

        let existingPair: EnrichedBreedingPair | null = null;
        if (existingLogEntry?.pairId) {
            const rawPair = allUserPairsRaw.find((p) => p.id === existingLogEntry.pairId);
            if (rawPair) {
                existingPair = await enrichAndSerializeBreedingPair(rawPair, userId);
            }
        }

        const suitablePairPromises = allUserPairsRaw
            .filter((pair) => {
                if (!pair.maleParent?.species || !pair.femaleParent?.species || !creature.species) {
                    return false;
                }
                const possibleOffspring = getPossibleOffspringSpecies(
                    pair.maleParent.species,
                    pair.femaleParent.species
                );
                return possibleOffspring.includes(creature.species);
            })
            .map((p) => enrichAndSerializeBreedingPair(p, userId));

        const suitablePairs = (await Promise.all(suitablePairPromises)).filter(
            (p): p is EnrichedBreedingPair => p !== null
        );

        return NextResponse.json({
            existingLogEntry,
            existingPair,
            suitablePairs,
            allLogs: allUserLogs,
            allCreatures: allUserCreatures.map(enrichAndSerializeCreature),
        });
    } catch (error) {
        console.error('Error fetching progeny logging context:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
