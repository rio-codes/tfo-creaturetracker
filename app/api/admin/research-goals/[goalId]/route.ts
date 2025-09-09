import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { logAdminAction } from '@/lib/audit';
import { enrichAndSerializeGoal } from '@/lib/serialization';

export async function GET(
    req: Request,
    props: { params: Promise<{ goalId: string }> }
) {
    const params = await props.params;
    const session = await auth();
    // @ts-expect-error session will be typed correctly in a later update
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const goal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, params.goalId),
        });

        if (!goal) {
            return NextResponse.json(
                { error: 'Research goal not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            enrichedGoal: enrichAndSerializeGoal(goal, goal.goalMode),
        });
    } catch (error) {
        console.error('Failed to fetch research goal details:', error);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ goalId: string }> }
) {
    const params = await props.params;
    const session = await auth();
    // @ts-expect-error session will be typed correctly in a later update
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const targetGoal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, params.goalId),
            columns: { name: true },
        });

        if (!targetGoal) {
            return NextResponse.json(
                { error: 'Research goal not found.' },
                { status: 404 }
            );
        }

        await db
            .delete(researchGoals)
            .where(eq(researchGoals.id, params.goalId));

        await logAdminAction({
            action: 'research_goal.delete',
            targetType: 'research_goal',
            targetId: params.goalId,
            details: {
                deletedGoalName: targetGoal.name,
            },
        });

        return NextResponse.json({
            message: 'Research goal deleted successfully.',
        });
    } catch (error) {
        console.error('Failed to delete research goal:', error);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
