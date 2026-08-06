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
        console.warn('[BREEDING_PAIRS][PIN] Unauthenticated attempt to pin pair.');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { pairId } = params;
    const { isPinned } = await req.json();
    const userId = session.user.id;

    console.log(`[BREEDING_PAIRS][PIN] Request for pairId=${pairId}, userId=${userId}, target isPinned=${isPinned}`);

    try {
        const updateResult = await db
            .update(breedingPairs)
            .set({ isPinned: isPinned })
            .where(and(eq(breedingPairs.id, pairId), eq(breedingPairs.userId, userId)))
            .returning();

        if (updateResult.length === 0) {
            console.warn(`[BREEDING_PAIRS][PIN] No breeding pair found matching pairId=${pairId} and userId=${userId}`);
        } else {
            console.log(`[BREEDING_PAIRS][PIN] Successfully updated pairId=${pairId} isPinned=${updateResult[0].isPinned}`);
        }

        revalidatePath('/breeding-pairs');

        const pair = updateResult[0] || await db.query.breedingPairs.findFirst({
            where: eq(breedingPairs.id, pairId),
        });

        await logUserAction({
            action: 'breedingPair.pin',
            description: `Breeding pair ${pair?.pairName} ${isPinned ? 'pinned' : 'unpinned'}.`,
        });

        return NextResponse.json({ success: true, isPinned: isPinned });
    } catch (error) {
        console.error('[BREEDING_PAIRS][PIN] Error updating pair pin status:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
