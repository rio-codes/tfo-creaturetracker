import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { breedingPairs, breedingLogEntries } from '@/src/db/schema';
import { eq, or } from 'drizzle-orm';
import { enrichAndSerializeBreedingPair } from '@/lib/serialization';
import { auth } from '@/auth';

export async function GET(request: Request, { params }: { params: { creatureId: string } }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { creatureId } = params;

    try {
        const logEntry = await db.query.breedingLogEntries.findFirst({
            where: or(
                eq(breedingLogEntries.progeny1Id, creatureId),
                eq(breedingLogEntries.progeny2Id, creatureId)
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
                eq(breedingPairs.maleParentId, creatureId),
                eq(breedingPairs.femaleParentId, creatureId)
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
