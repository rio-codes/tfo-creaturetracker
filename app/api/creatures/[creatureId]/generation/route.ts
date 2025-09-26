import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const patchBodySchema = z.object({
    generation: z.number().int().positive().nullable(),
    g1Origin: z.enum(['cupboard', 'genome-splicer', 'another-lab']).nullable(),
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

        if (generation !== 1 && g1Origin) {
            return NextResponse.json(
                { error: 'G1 Origin can only be set for G1 creatures.' },
                { status: 400 }
            );
        }

        const [updatedCreature] = await db
            .update(creatures)
            .set({
                generation,
                g1Origin: generation === 1 ? g1Origin : null, // Clear origin if not G1
            })
            .where(and(eq(creatures.id, creatureId), eq(creatures.userId, userId)))
            .returning();

        return NextResponse.json(updatedCreature);
    } catch (error) {
        console.error('[CREATURE_GENERATION_PATCH]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
