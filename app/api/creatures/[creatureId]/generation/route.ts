import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs, breedingLogEntries } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logUserAction } from '@/lib/user-actions';
import { calculateGeneration } from '@/lib/creature-utils';

const patchBodySchema = z.object({
    generation: z.number().int().positive().nullable(),
    origin: z
        .enum(['unknown', 'cupboard', 'genome-splicer', 'another-lab', 'quest', 'raffle'])
        .nullable(),
});

export async function PATCH(request: Request, { params }: { params: { creatureId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    try {
        const { creatureId } = params;
        const body = await request.json();
        const validation = patchBodySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
        }

        const { generation: manualGeneration, origin } = validation.data;

        // Fetch data needed for generation calculation
        const [allUserPairs, allUserLogs, creatureToUpdate] = await Promise.all([
            db.query.breedingPairs.findMany({ where: eq(breedingPairs.userId, userId) }),
            db.query.breedingLogEntries.findMany({ where: eq(breedingLogEntries.userId, userId) }),
            db.query.creatures.findFirst({
                where: and(eq(creatures.id, creatureId), eq(creatures.userId, userId)),
            }),
        ]);

        if (!creatureToUpdate) {
            return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
        }

        // If the creature is progeny, its generation is calculated. Otherwise, use manual input or fallback to 1.
        const calculatedGeneration = calculateGeneration(creatureId, allUserPairs, allUserLogs);
        const finalGeneration =
            calculatedGeneration > 1 ? calculatedGeneration : manualGeneration || 1;

        if (finalGeneration > 1 && origin && origin !== 'another-lab') {
            return NextResponse.json(
                { error: 'Only "Another Lab" origin can be set for non-G1 creatures.' },
                { status: 400 }
            );
        }

        const finalOrigin =
            finalGeneration > 1 && origin !== 'another-lab' ? 'unknown' : origin || 'unknown';

        const [updatedCreature] = await db
            .update(creatures)
            .set({ generation: finalGeneration, origin: finalOrigin })
            .where(and(eq(creatures.id, creatureId), eq(creatures.userId, userId)))
            .returning();

        await logUserAction({
            action: 'creature.update',
            description: `Manually updated creature "${updatedCreature.creatureName} (${updatedCreature.code})". Set Generation: G${finalGeneration}, Origin: ${finalOrigin}.`,
        });

        return NextResponse.json(updatedCreature);
    } catch (error) {
        console.error('[CREATURE_GENERATION_PATCH]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
