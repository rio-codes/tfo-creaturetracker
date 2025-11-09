import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';

export async function PATCH(req: Request, { params }: { params: { goalId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { goalId } = await params;

    try {
        await db
            .update(researchGoals)
            .set({ isAchieved: true, updatedAt: new Date() })
            .where(eq(researchGoals.id, goalId));

        await logUserAction({
            action: 'goal.achieve',
            description: `Marked goal as achieved.`,
            link: `/research-goals/${goalId}`,
        });

        revalidatePath('/research-goals');
        return NextResponse.json({ message: 'Goal marked as achieved!' });
    } catch (error) {
        console.error('Failed to mark goal as achieved:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
