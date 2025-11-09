import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, researchGoals } from '@/src/db/schema';
import { and, eq, inArray, gte } from 'drizzle-orm';
import { z } from 'zod';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/serialization';
import { creatureMatchesGoal } from '@/lib/creature-utils';

const analysisSchema = z.object({
    syncedCreatureCodes: z.array(z.string()),
    allTfoCreatureCodes: z.array(z.string()).optional(),
    isFullSync: z.boolean(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = analysisSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const { syncedCreatureCodes, allTfoCreatureCodes, isFullSync } = validated.data;

        const syncTimeWindow = new Date(Date.now() - 60 * 1000);

        const newlySyncedCreatures = await db.query.creatures.findMany({
            where: and(
                eq(creatures.userId, userId),
                inArray(creatures.code, syncedCreatureCodes),
                gte(creatures.updatedAt, syncTimeWindow)
            ),
        });

        const userGoals = await db.query.researchGoals.findMany({
            where: and(eq(researchGoals.userId, userId), eq(researchGoals.isAchieved, false)),
        });

        const enrichedCreatures = newlySyncedCreatures.map(enrichAndSerializeCreature);
        const enrichedGoals = userGoals.map((g) => enrichAndSerializeGoal(g, g.goalMode));

        const matchingGoals = [];
        for (const goal of enrichedGoals) {
            if (!goal) continue;
            for (const creature of enrichedCreatures) {
                if (creature && creatureMatchesGoal(creature, goal)) {
                    matchingGoals.push({ goal, matchingCreature: creature });
                    break;
                }
            }
        }
        let archivableCreatures: any[] = [];
        if (isFullSync && allTfoCreatureCodes) {
            const userCreaturesInDb = await db.query.creatures.findMany({
                where: and(eq(creatures.userId, userId), eq(creatures.isArchived, false)),
                columns: { id: true, code: true, creatureName: true },
            });

            const creaturesNotInTfo = userCreaturesInDb.filter(
                (c) => !allTfoCreatureCodes.includes(c.code)
            );

            archivableCreatures = creaturesNotInTfo;
        }
        const matchingChecklistSlots: any[] = [];

        return NextResponse.json({
            matchingGoals,
            matchingChecklistSlots,
            archivableCreatures,
        });
    } catch (error: any) {
        console.error('Post-sync analysis failed:', error);
        return NextResponse.json(
            { error: 'An internal error occurred during analysis.' },
            { status: 500 }
        );
    }
}
