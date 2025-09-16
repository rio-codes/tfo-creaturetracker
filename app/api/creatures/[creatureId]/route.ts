import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { enrichAndSerializeCreature } from '@/lib/serialization';
import * as Sentry from '@sentry/nextjs';
import { logAdminAction } from '@/lib/audit';

// This function handles GET requests to /api/creatures/[creatureId]

export async function GET(req: Request, props: { params: Promise<{ creatureId: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Fetching creature ${params.creatureId}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage(`Forbidden access to fetch creature ${params.creatureId}`, 'log');
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const creature = await db.query.creatures.findFirst({
            where: eq(creatures.id, params.creatureId),
        });

        if (!creature) {
            Sentry.captureMessage(`Creature not found: ${params.creatureId}`, 'log');
            return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
        }

        // For the card, we need the owner's other creatures for the "Manage Pairs" dialog.
        const allCreatures = await db.query.creatures.findMany({
            where: eq(creatures.userId, creature.userId),
        });

        Sentry.captureMessage(`Successfully fetched creature ${params.creatureId}`, 'info');
        return NextResponse.json({
            creature: enrichAndSerializeCreature(creature),
            allCreatures: allCreatures.map(enrichAndSerializeCreature),
        });
    } catch (error) {
        Sentry.captureException(error);
        console.error('Failed to fetch creature details:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// This function handles DELETE requests to /api/creatures/[creatureId]
export async function DELETE(req: Request, props: { params: Promise<{ creatureId: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Deleting creature ${params.creatureId}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to delete creature', 'log');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { creatureId } = params;
    if (!creatureId) {
        Sentry.captureMessage('Creature ID not provided for deletion', 'log');
        return NextResponse.json({ error: 'Creature ID is required.' }, { status: 400 });
    }

    const creatureOwner = await db.query.creatures.findFirst({
        where: eq(creatures.id, creatureId),
        columns: { userId: true },
    });

    try {
        let result;
        if (session.user.role === 'admin') {
            // Admin deleting another user's creature
            result = await db.delete(creatures).where(eq(creatures.id, creatureId)).returning();
        } else {
            // User deleting their own creature
            result = await db
                .delete(creatures)
                .where(and(eq(creatures.id, creatureId), eq(creatures.userId, session.user.id)))
                .returning(); // .returning() gives us back the row that was deleted
        }

        if (result.length === 0) {
            Sentry.captureMessage(`Creature not found for deletion: ${creatureId}`, 'log');
            return NextResponse.json(
                {
                    error: 'Creature not found or you do not have permission to delete it.',
                },
                { status: 404 }
            );
        }

        if (session.user.role === 'admin') {
            await logAdminAction({
                action: 'creature.delete',
                targetType: 'creature',
                targetId: creatureId,
                targetUserId: creatureOwner?.userId,
                details: {
                    adminId: session.user.id,
                },
            });
        }
        // Clear the cache for the collection page so the grid updates immediately
        revalidatePath('/collection');

        Sentry.captureMessage(`Creature ${creatureId} deleted successfully`, 'info');
        return NextResponse.json({ message: 'Creature deleted successfully.' }, { status: 200 });
    } catch (error) {
        Sentry.captureException(error);
        console.error('Failed to delete creature:', error);
        // Handle potential foreign key constraint errors if a creature is part of a pair
        if ((error as any).code === '23503') {
            Sentry.captureMessage(`Attempted to delete creature in a pair: ${creatureId}`, 'log');
            // PostgreSQL foreign key violation error code
            return NextResponse.json(
                {
                    error: 'Cannot delete this creature because it is part of an active breeding pair. Please remove it from the pair first.',
                },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
