import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs, researchGoals, breedingLogEntries } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { enrichAndSerializeCreature } from '@/lib/serialization';

export async function GET(_request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const [allUserCreaturesRaw, allUserPairsRaw, allUserGoalsRaw, allUserLogsRaw] =
            await Promise.all([
                db.query.creatures.findMany({
                    where: and(eq(creatures.userId, userId), eq(creatures.isArchived, false)),
                }),
                db.query.breedingPairs.findMany({
                    where: eq(breedingPairs.userId, userId),
                }),
                db.query.researchGoals.findMany({ where: eq(researchGoals.userId, userId) }),
                db.query.breedingLogEntries.findMany({
                    where: eq(breedingLogEntries.userId, userId),
                }),
            ]);

        const allCreatures = allUserCreaturesRaw.map(enrichAndSerializeCreature);

        return NextResponse.json({
            allCreatures,
            allGoals: allUserGoalsRaw,
            allPairs: allUserPairsRaw,
            allLogs: allUserLogsRaw,
        });
    } catch (error) {
        console.error('Error fetching add pair context:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
