import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';

export async function PATCH(req: Request, props: { params: Promise<{ creatureId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { creatureId } = params;
    const { isPinned } = await req.json();

    if (typeof isPinned !== 'boolean') {
        return NextResponse.json({ error: 'Invalid "isPinned" value provided.' }, { status: 400 });
    }

    try {
        const result = await db
            .update(creatures)
            .set({ isPinned: isPinned })
            .where(and(eq(creatures.id, creatureId), eq(creatures.userId, session.user.id)))
            .returning({
                updatedId: creatures.id,
                updatedName: creatures.creatureName,
                updatedCode: creatures.code,
            });

        if (result.length === 0) {
            return NextResponse.json(
                {
                    error: 'Creature not found or you do not have permission to edit it.',
                },
                { status: 404 }
            );
        }
        revalidatePath('/collection');

        await logUserAction({
            action: 'creature.update',
            description: `Updated creature pin status fpr creature "${result[0].updatedName} (${result[0].updatedCode})" to ${isPinned ? 'pinned' : 'un-pinned'}`,
        });

        return NextResponse.json({ success: true, isPinned: isPinned });
    } catch (error) {
        console.error('Failed to update creature pin status:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
