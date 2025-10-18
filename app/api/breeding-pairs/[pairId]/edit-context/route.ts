import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, researchGoals, breedingPairs, breedingLogEntries } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/client-serialization';

export async function GET(request: Request, props: { params: Promise<{ pairId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;
    const { pairId } = params;

    try {
        const pairExists = await db.query.breedingPairs.findFirst({
            where: and(eq(breedingPairs.id, pairId), eq(breedingPairs.userId, userId)),
            columns: { id: true },
        });

        if (!pairExists) {
            return NextResponse.json(
                { error: 'Breeding pair not found or access denied.' },
                { status: 404 }
            );
        }

        const [allUserCreaturesRaw, allUserGoalsRaw, allUserPairsRaw, allUserLogsRaw] =
            await Promise.all([
                db.query.creatures.findMany({ where: eq(creatures.userId, userId) }),
                db.query.researchGoals.findMany({ where: eq(researchGoals.userId, userId) }),
                db.query.breedingPairs.findMany({ where: eq(breedingPairs.userId, userId) }),
                db.query.breedingLogEntries.findMany({
                    where: eq(breedingLogEntries.userId, userId),
                }),
            ]);

        const allCreatures = allUserCreaturesRaw.map(enrichAndSerializeCreature);
        const allGoals = allUserGoalsRaw.map((goal) => enrichAndSerializeGoal(goal, goal.goalMode));

        return NextResponse.json({
            allCreatures,
            allGoals,
            allPairs: allUserPairsRaw,
            allLogs: allUserLogsRaw,
        });
    } catch (error) {
        console.error(`Error fetching edit context for pair ${pairId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
