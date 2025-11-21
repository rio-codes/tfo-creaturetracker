import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, researchGoals } from '@/src/db/schema';
import { and, eq, gte } from 'drizzle-orm';
import { z } from 'zod';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/serialization';
import { creatureMatchesGoal } from '@/lib/creature-utils';

const analysisSchema = z.object({
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

        // Instead of getting codes from the client, we'll find creatures
        // that were recently updated by the sync job.
        const syncTimeWindow = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

        const newlySyncedCreatures = await db.query.creatures.findMany({
            where: and(eq(creatures.userId, userId), gte(creatures.updatedAt, syncTimeWindow)),
        });

        const userGoals = await db.query.researchGoals.findMany({
            where: and(eq(researchGoals.userId, userId), eq(researchGoals.isAchieved, false)),
        });

        const enrichedGoals = userGoals.map((g) => enrichAndSerializeGoal(g, g.goalMode));

        const matchingGoals = [];
        for (const goal of enrichedGoals) {
            if (!goal) continue;
            for (const creature of newlySyncedCreatures) {
                const enrichedCreature = enrichAndSerializeCreature(creature);
                if (enrichedCreature && creatureMatchesGoal(enrichedCreature, goal)) {
                    console.log('Match found!');
                    matchingGoals.push({ goal, matchingCreature: enrichedCreature });
                    break; // Move to the next goal once a match is found
                }
            }
        }
        const archivableCreatures: any[] = [];
        // The logic for archivable creatures is disabled for now as it requires
        // the full list of creature codes from TFO, which we are not passing anymore.
        // This could be re-enabled if the sync worker is updated to store this information.

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
