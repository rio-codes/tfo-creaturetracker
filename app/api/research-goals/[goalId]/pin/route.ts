import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';

export async function PATCH(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { goalId } = params;
    const { isPinned } = await req.json();

    if (typeof isPinned !== 'boolean') {
        return NextResponse.json({ error: 'Invalid "isPinned" value provided.' }, { status: 400 });
    }

    try {
        const result = await db
            .update(researchGoals)
            .set({ isPinned: isPinned })
            .where(and(eq(researchGoals.id, goalId), eq(researchGoals.userId, session.user.id)))
            .returning({ updatedId: researchGoals.id });

        if (result.length === 0) {
            return NextResponse.json(
                {
                    error: 'Goal not found or you do not have permission to edit it.',
                },
                { status: 404 }
            );
        }

        const goal = await db.query.researchGoals.findFirst({
            where: and(eq(researchGoals.id, goalId), eq(researchGoals.userId, session.user.id)),
        });

        revalidatePath('/research-goals');

        await logUserAction({
            action: 'researchGoal.pin',
            description: `Research goal "${goal?.name}" ${isPinned ? 'pinned' : 'unpinned'}.`,
        });

        return NextResponse.json({ success: true, isPinned: isPinned });
    } catch (error) {
        console.error('Failed to update goal pin status:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
