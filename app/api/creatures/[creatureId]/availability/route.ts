import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const availabilitySchema = z.object({
    isForSaleOrTrade: z.boolean().optional(),
    isForStud: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ creatureId: string }> }) {
    const creatureId = (await params).creatureId;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        console.log(body);
        console.log(creatureId);
        const validated = availabilitySchema.safeParse(body);

        if (!validated.success) {
            console.error('Zod validation failed for availability:', validated.error);
            return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
        }

        const { isForSaleOrTrade, isForStud } = validated.data;

        const [updatedCreature] = await db
            .update(creatures)
            .set({
                isForSaleOrTrade,
                isForStud,
            })
            .where(and(eq(creatures.id, creatureId), eq(creatures.userId, userId)))
            .returning({ id: creatures.id });

        if (!updatedCreature) {
            return NextResponse.json(
                { error: 'Creature not found or you do not have permission to edit it.' },
                { status: 404 }
            );
        }

        revalidatePath('/collection');
        revalidatePath(`/${session.user.username}`);

        return NextResponse.json({
            message: 'Creature availability updated successfully.',
        });
    } catch (error) {
        console.error('Failed to update creature availability:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
