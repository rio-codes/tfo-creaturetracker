import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';

export async function PATCH(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const { goalId } = params;

        const goal = await db.query.researchGoals.findFirst({
            where: and(eq(researchGoals.id, goalId), eq(researchGoals.userId, userId)),
        });

        if (!goal) {
            return NextResponse.json(
                {
                    error: 'Goal not found or you do not have permission to edit it.',
                },
                { status: 404 }
            );
        }

        const newWishlistStatus = !goal.isPublic;

        await db
            .update(researchGoals)
            .set({ isPublic: newWishlistStatus, updatedAt: new Date() })
            .where(eq(researchGoals.id, goalId));

        revalidatePath(`/research-goals/${goalId}`);
        revalidatePath('/community-wishlist');

        await logUserAction({
            action: 'researchGoal.toggleWishlist',
            description: `Research goal "${goal.name}" ${
                newWishlistStatus ? 'added to' : 'removed from'
            } wishlist.`,
            link: `/research-goals/${goal.id}`,
        });

        return NextResponse.json({
            message: `Goal ${
                newWishlistStatus ? 'added to' : 'removed from'
            } wishlist successfully.`,
        });
    } catch (error: any) {
        console.error('Failed to switch goal mode:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
