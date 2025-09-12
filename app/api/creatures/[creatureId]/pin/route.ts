import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as Sentry from '@sentry/nextjs';

export async function PATCH(
    req: Request,
    props: { params: Promise<{ creatureId: string }> }
) {
    const params = await props.params;
    Sentry.captureMessage(
        `Pinning/unpinning creature ${params.creatureId}`,
        'log'
    );
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage(
            'Unauthenticated attempt to pin creature',
            'warning'
        );
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    const { creatureId } = params;
    const { isPinned } = await req.json();

    if (typeof isPinned !== 'boolean') {
        Sentry.captureMessage(
            'Invalid isPinned value provided for pinning creature',
            'warning'
        );
        return NextResponse.json(
            { error: 'Invalid "isPinned" value provided.' },
            { status: 400 }
        );
    }

    try {
        const result = await db
            .update(creatures)
            .set({ isPinned: isPinned })
            .where(
                and(
                    eq(creatures.id, creatureId),
                    eq(creatures.userId, session.user.id)
                )
            )
            .returning({ updatedId: creatures.id });

        if (result.length === 0) {
            Sentry.captureMessage(
                `Creature not found for pinning: ${creatureId}`,
                'warning'
            );
            return NextResponse.json(
                {
                    error: 'Creature not found or you do not have permission to edit it.',
                },
                { status: 404 }
            );
        }
        Sentry.captureMessage(
            `Creature ${creatureId} pin status set to ${isPinned}`,
            'info'
        );
        revalidatePath('/collection');

        return NextResponse.json({ success: true, isPinned: isPinned });
    } catch (error) {
        console.error('Failed to update creature pin status:', error);
        Sentry.captureException(error);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
