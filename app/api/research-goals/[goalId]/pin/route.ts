import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as Sentry from '@sentry/nextjs';

export async function PATCH(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Pinning/unpinning goal ${params.goalId}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to pin goal', 'log');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { goalId } = params;
    const { isPinned } = await req.json();

    if (typeof isPinned !== 'boolean') {
        Sentry.captureMessage('Invalid isPinned value for pinning goal', 'log');
        return NextResponse.json({ error: 'Invalid "isPinned" value provided.' }, { status: 400 });
    }

    try {
        const result = await db
            .update(researchGoals)
            .set({ isPinned: isPinned })
            .where(and(eq(researchGoals.id, goalId), eq(researchGoals.userId, session.user.id)))
            .returning({ updatedId: researchGoals.id });

        if (result.length === 0) {
            Sentry.captureMessage(`Goal not found for pinning: ${goalId}`, 'log');
            return NextResponse.json(
                {
                    error: 'Goal not found or you do not have permission to edit it.',
                },
                { status: 404 }
            );
        }

        Sentry.captureMessage(`Goal ${goalId} pin status set to ${isPinned}`, 'info');
        revalidatePath('/research-goals');

        return NextResponse.json({ success: true, isPinned: isPinned });
    } catch (error) {
        console.error('Failed to update goal pin status:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
