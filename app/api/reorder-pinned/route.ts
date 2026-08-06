import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals, creatures, breedingPairs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { logUserAction } from '@/lib/user-actions';

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        console.warn('[REORDER_PINNED] Unauthenticated request.');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { type, orderedIds } = await request.json();
        console.log(`[REORDER_PINNED] Request by userId=${session.user.id}: type=${type}, orderedIdsCount=${orderedIds?.length}`);

        if (!type || !Array.isArray(orderedIds)) {
            console.warn('[REORDER_PINNED] Invalid request body:', { type, orderedIds });
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        let table;
        switch (type) {
            case 'research-goal':
                table = researchGoals;
                break;
            case 'creature':
                table = creatures;
                break;
            case 'breeding-pair':
                table = breedingPairs;
                break;
            default:
                console.warn(`[REORDER_PINNED] Invalid type "${type}" requested.`);
                return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
        }

        // Use a transaction to update all items atomically
        await db.transaction(async (tx) => {
            for (let i = 0; i < orderedIds.length; i++) {
                const id = orderedIds[i];
                await tx.update(table).set({ pinOrder: i }).where(eq(table.id, id));
            }
        });

        console.log(`[REORDER_PINNED] Successfully reordered ${orderedIds.length} ${type} items for userId=${session.user.id}`);

        await logUserAction({
            action: 'reorder.pinned',
            description: `Reordered pinned ${type}s.`,
        });

        return NextResponse.json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('[REORDER_PINNED] Error reordering items:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
