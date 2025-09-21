import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function PATCH(req: Request, { params }: { params: { creatureId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { creatureId } = params;
    if (!creatureId) {
        return NextResponse.json({ error: 'Creature ID is required.' }, { status: 400 });
    }

    const { isArchived } = await req.json();
    if (typeof isArchived !== 'boolean') {
        return NextResponse.json({ error: 'Invalid "isArchived" value.' }, { status: 400 });
    }

    try {
        const result = await db
            .update(creatures)
            .set({ isArchived, updatedAt: new Date() })
            .where(and(eq(creatures.id, creatureId), eq(creatures.userId, session.user.id)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Creature not found or you do not have permission to modify it.' },
                { status: 404 }
            );
        }

        revalidatePath('/collection');

        return NextResponse.json({
            message: `Creature ${isArchived ? 'archived' : 'un-archived'} successfully.`,
        });
    } catch (error) {
        console.error('Failed to update creature archive status:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
