import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as Sentry from '@sentry/nextjs';

export async function PATCH(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Toggling mode for goal ${params.goalId}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to toggle goal mode', 'log');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const { goalId } = params;

        //  fetch the goal to ensure it exists and belongs to the user
        const goal = await db.query.researchGoals.findFirst({
            where: and(eq(researchGoals.id, goalId), eq(researchGoals.userId, userId)),
        });

        if (!goal) {
            Sentry.captureMessage(`Goal not found for mode toggle: ${goalId}`, 'log');
            return NextResponse.json(
                {
                    error: 'Goal not found or you do not have permission to edit it.',
                },
                { status: 404 }
            );
        }

        // determine the new mode
        const newMode = goal.goalMode === 'phenotype' ? 'genotype' : 'phenotype';

        // update the goal in the database with the new mode
        await db
            .update(researchGoals)
            .set({ goalMode: newMode })
            .where(eq(researchGoals.id, goalId));

        // Revalidate the path to ensure the page re-fetches data
        revalidatePath(`/research-goals/${goalId}`);

        Sentry.captureMessage(`Goal ${goalId} mode switched to ${newMode}`, 'info');
        return NextResponse.json({
            message: `Goal mode switched to ${newMode} successfully.`,
        });
    } catch (error: any) {
        console.error('Failed to switch goal mode:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
