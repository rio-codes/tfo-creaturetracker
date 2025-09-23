import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { enrichAndSerializeCreature } from '@/lib/serialization';
import { logUserAction } from '@/lib/user-actions';
import { z } from 'zod';

const creatureUpdateSchema = z.object({
    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    pinOrder: z.number().optional(),
});

export async function GET(req: Request, props: { params: Promise<{ creatureId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const creature = await db.query.creatures.findFirst({
            where: eq(creatures.id, params.creatureId),
        });

        if (!creature) {
            return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
        }

        // For the card, we need the owner's other creatures for the "Manage Pairs" dialog.
        const allCreatures = await db.query.creatures.findMany({
            where: eq(creatures.userId, creature.userId),
        });

        return NextResponse.json({
            creature: enrichAndSerializeCreature(creature),
            allCreatures: allCreatures.map(enrichAndSerializeCreature),
        });
    } catch (error) {
        console.error('Failed to fetch creature details:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { creatureId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedFields = creatureUpdateSchema.safeParse(body);
        if (!validatedFields.success) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const { isPinned, isArchived, pinOrder } = validatedFields.data;

        const [creatureToUpdate] = await db
            .select({ creatureName: creatures.creatureName, code: creatures.code })
            .from(creatures)
            .where(and(eq(creatures.id, params.creatureId), eq(creatures.userId, session.user.id)));

        if (!creatureToUpdate) {
            return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
        }

        const updateData: Partial<typeof creatures.$inferInsert> = { updatedAt: new Date() };
        let actionDescription = '';
        let actionType = '';

        if (typeof isPinned === 'boolean') {
            updateData.isPinned = isPinned;
            updateData.pinOrder = isPinned ? pinOrder : null;
            actionType = isPinned ? 'creature.pin' : 'creature.unpin';
            actionDescription = `${isPinned ? 'Pinned' : 'Unpinned'} creature "${creatureToUpdate.creatureName} (${creatureToUpdate.code})"`;
        }

        if (typeof isArchived === 'boolean') {
            updateData.isArchived = isArchived;
            actionType = isArchived ? 'creature.archive' : 'creature.unarchive';
            actionDescription = `${isArchived ? 'Archived' : 'Unarchived'} creature "${creatureToUpdate.creatureName} (${creatureToUpdate.code})"`;
        }

        if (Object.keys(updateData).length > 1) {
            await db.update(creatures).set(updateData).where(eq(creatures.id, params.creatureId));

            await logUserAction({ action: actionType, description: actionDescription });
        }

        revalidatePath('/collection');
        return NextResponse.json({ message: 'Creature updated' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
