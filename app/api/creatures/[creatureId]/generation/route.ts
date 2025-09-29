import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logUserAction } from '@/lib/user-actions';

const patchBodySchema = z.object({
    generation: z.number().int().positive().nullable(),
    g1Origin: z.enum(['cupboard', 'genome-splicer', 'another-lab', 'quest']).nullable(),
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

        const { generation, g1Origin } = validation.data;

        if (generation !== 1 && g1Origin && g1Origin !== 'another-lab') {
            return NextResponse.json(
                { error: 'Only "Another Lab" origin can be set for non-G1 creatures.' },
                { status: 400 }
            );
        }

        const [updatedCreature] = await db
            .update(creatures)
            .set({
                generation: generation || 1,
                g1Origin: generation === 1 || g1Origin === 'another-lab' ? g1Origin : null,
            })
            .where(and(eq(creatures.id, creatureId), eq(creatures.userId, userId)))
            .returning();

        if (generation !== 1) {
            await logUserAction({
                action: 'creature.update',
                description: `Updated creature generation for creature "${updatedCreature.creatureName} (${updatedCreature.code})" to G${generation}`,
            });
        } else if (g1Origin) {
            await logUserAction({
                action: 'creature.update',
                description: `Updated G1 creature origin to ${g1Origin.toString()}`,
            });
        }

        return NextResponse.json(updatedCreature);
    } catch (error) {
        console.error('[CREATURE_GENERATION_PATCH]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
