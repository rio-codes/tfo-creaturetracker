import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { breedingPairs } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';

export async function PATCH(req: Request, props: { params: Promise<{ pairId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { pairId } = params;
    const { isPinned } = await req.json();

    try {
        await db
            .update(breedingPairs)
            .set({ isPinned: isPinned })
            .where(and(eq(breedingPairs.id, pairId), eq(breedingPairs.userId, session.user.id)));

        revalidatePath('/breeding-pairs');

        const pair = await db.query.breedingPairs.findFirst({
            where: eq(breedingPairs.id, pairId),
        });

        await logUserAction({
            action: 'breedingPair.pin',
            description: `Breeding pair ${pair?.pairName} ${isPinned ? 'pinned' : 'unpinned'}.`,
        });

        return NextResponse.json({ success: true, isPinned: isPinned });
    } catch (error) {
        console.error('Failed to update pair:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
