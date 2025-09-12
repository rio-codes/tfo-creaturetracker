import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { breedingPairs } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as Sentry from '@sentry/nextjs';

export async function PATCH(
    req: Request,
    props: { params: Promise<{ pairId: string }> }
) {
    const params = await props.params;
    Sentry.captureMessage(`Pinning/unpinning pair ${params.pairId}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to pin pair', 'warning');
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    const { pairId } = params;
    const { isPinned } = await req.json();

    try {
        await db
            .update(breedingPairs)
            .set({ isPinned: isPinned })
            .where(
                and(
                    eq(breedingPairs.id, pairId),
                    eq(breedingPairs.userId, session.user.id)
                )
            );

        Sentry.captureMessage(
            `Pair ${pairId} pin status set to ${isPinned}`,
            'info'
        );
        revalidatePath('/breeding-pairs');
        return NextResponse.json({ success: true, isPinned: isPinned });
    } catch (error) {
        Sentry.captureException(error);
        console.error('Failed to update pair:', error);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
