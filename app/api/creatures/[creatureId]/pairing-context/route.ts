import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs, researchGoals, breedingLogEntries } from '@/src/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { enrichAndSerializeCreature, enrichAndSerializeBreedingPair } from '@/lib/serialization';
import { findSuitableMates } from '@/lib/breeding-rules';

export async function GET(request: Request, { params }: { params: { creatureId: string } }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;
    const { creatureId } = params;

    try {
        const [
            baseCreature,
            allUserCreaturesRaw,
            allUserPairsRaw,
            allUserGoalsRaw,
            allUserLogsRaw,
        ] = await Promise.all([
            db.query.creatures.findFirst({
                where: and(eq(creatures.id, creatureId), eq(creatures.userId, userId)),
            }),
            db.query.creatures.findMany({
                where: and(eq(creatures.userId, userId), eq(creatures.isArchived, false)),
            }),
            db.query.breedingPairs.findMany({
                where: eq(breedingPairs.userId, userId),
                with: {
                    maleParent: true,
                    femaleParent: true,
                },
            }),
            db.query.researchGoals.findMany({ where: eq(researchGoals.userId, userId) }),
            db.query.breedingLogEntries.findMany({ where: eq(breedingLogEntries.userId, userId) }),
        ]);

        if (!baseCreature) {
            return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
        }

        const enrichedBaseCreature = enrichAndSerializeCreature(baseCreature);
        if (!enrichedBaseCreature) {
            return NextResponse.json({ error: 'Failed to process creature data' }, { status: 500 });
        }
        const allEnrichedCreatures = allUserCreaturesRaw.map(enrichAndSerializeCreature);

        const existingPairPromises = allUserPairsRaw
            .filter((p) => p.maleParentId === creatureId || p.femaleParentId === creatureId)
            .map(async (pair) => {
                if (pair.assignedGoalIds && pair.assignedGoalIds.length > 0) {
                    const goals = await db.query.researchGoals.findMany({
                        where: inArray(researchGoals.id, pair.assignedGoalIds),
                    });
                    return enrichAndSerializeBreedingPair(
                        {
                            ...pair,
                            assignedGoals: goals.map((goal) => ({ goal })),
                        },
                        userId
                    );
                }
                return enrichAndSerializeBreedingPair(pair, userId);
            });

        const existingPairs = (await Promise.all(existingPairPromises)).filter((p) => p !== null);

        const existingPartnerIds = new Set(
            allUserPairsRaw
                .filter((p) => p.maleParentId === creatureId || p.femaleParentId === creatureId)
                .map((p) => (p.maleParentId === creatureId ? p.femaleParentId : p.maleParentId))
        );

        const suitableMates = findSuitableMates(enrichedBaseCreature, allEnrichedCreatures).filter(
            (mate) => mate && !existingPartnerIds.has(mate.id)
        );

        return NextResponse.json({
            existingPairs,
            suitableMates,
            allCreatures: allEnrichedCreatures,
            allGoals: allUserGoalsRaw,
            allRawPairs: allUserPairsRaw,
            allLogs: allUserLogsRaw,
        });
    } catch (error) {
        console.error('Error fetching pairing context:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
