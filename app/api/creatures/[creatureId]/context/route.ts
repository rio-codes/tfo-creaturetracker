import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { breedingPairs, breedingLogEntries, creatures } from '@/src/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { enrichAndSerializeBreedingPair } from '@/lib/serialization';
import { auth } from '@/auth';

export async function GET(request: Request, props: { params: Promise<{ creatureId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { creatureId } = params;

    // First, get the creature's own details to find its composite key
    const creature = await db.query.creatures.findFirst({
        where: eq(creatures.id, creatureId),
        columns: { userId: true, code: true },
    });

    if (!creature) {
        return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
    }

    try {
        const logEntry = await db.query.breedingLogEntries.findFirst({
            where: or(
                and(
                    eq(breedingLogEntries.progeny1UserId, creature.userId),
                    eq(breedingLogEntries.progeny1Code, creature.code)
                ),
                and(
                    eq(breedingLogEntries.progeny2UserId, creature.userId),
                    eq(breedingLogEntries.progeny2Code, creature.code)
                )
            ),
        });

        let parentPair = null;
        if (logEntry && logEntry.pairId) {
            const pair = await db.query.breedingPairs.findFirst({
                where: eq(breedingPairs.id, logEntry.pairId),
                with: {
                    maleParent: true,
                    femaleParent: true,
                },
            });

            if (pair) {
                parentPair = await enrichAndSerializeBreedingPair(pair, session.user.id);
            }
        }

        const asParent = await db.query.breedingPairs.findFirst({
            where: or(
                and(
                    eq(breedingPairs.maleParentUserId, creature.userId),
                    eq(breedingPairs.maleParentCode, creature.code)
                ),
                and(
                    eq(breedingPairs.femaleParentUserId, creature.userId),
                    eq(breedingPairs.femaleParentCode, creature.code)
                )
            ),
            columns: {
                id: true,
            },
        });

        const isParentOfPair = !!asParent;
        return NextResponse.json({ parentPair, isParentOfPair });
    } catch (error) {
        console.error('Error fetching creature relationship context:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
