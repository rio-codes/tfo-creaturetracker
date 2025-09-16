import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { logAdminAction } from '@/lib/audit';
import { enrichAndSerializeGoal } from '@/lib/serialization';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Admin: fetching research goal ${params.goalId}`, 'info');

    if (!session?.user?.id || session.user.role !== 'admin') {
        Sentry.captureMessage(
            `Forbidden access to admin fetch research goal ${params.goalId}`,
            'log'
        );
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const goal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, params.goalId),
        });

        if (!goal) {
            Sentry.captureMessage(`Admin: research goal not found ${params.goalId}`, 'log');
            return NextResponse.json({ error: 'Research goal not found' }, { status: 404 });
        }

        Sentry.captureMessage(`Admin: successfully fetched research goal ${params.goalId}`, 'info');
        return NextResponse.json({
            enrichedGoal: enrichAndSerializeGoal(goal, goal.goalMode),
        });
    } catch (error) {
        console.error('Failed to fetch research goal details:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Admin: deleting research goal ${params.goalId}`, 'info');

    if (!session?.user?.id || session.user.role !== 'admin') {
        Sentry.captureMessage(
            `Forbidden access to admin delete research goal ${params.goalId}`,
            'log'
        );
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const targetGoal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, params.goalId),
            columns: { name: true, userId: true },
        });

        if (!targetGoal) {
            Sentry.captureMessage(
                `Admin: research goal to delete not found ${params.goalId}`,
                'log'
            );
            return NextResponse.json({ error: 'Research goal not found.' }, { status: 404 });
        }

        await db.delete(researchGoals).where(eq(researchGoals.id, params.goalId));

        await logAdminAction({
            action: 'research_goal.delete',
            targetType: 'research_goal',
            targetId: params.goalId,
            targetUserId: targetGoal.userId,
            details: {
                deletedGoalName: targetGoal.name,
            },
        });

        Sentry.captureMessage(`Admin: successfully deleted research goal ${params.goalId}`, 'info');
        return NextResponse.json({
            message: 'Research goal deleted successfully.',
        });
    } catch (error) {
        console.error('Failed to delete research goal:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
