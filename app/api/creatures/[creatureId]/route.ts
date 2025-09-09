import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs, researchGoals } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/audit';
import {
    enrichAndSerializeCreature,
    enrichAndSerializeGoal,
} from '@/lib/serialization';
import { getAllBreedingPairsForUser } from '@/lib/data';

export async function GET(
    req: Request,
    props: { params: Promise<{ creatureId: string }> }
) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const creature = await db.query.creatures.findFirst({
            where: eq(creatures.id, params.creatureId),
        });

        if (!creature) {
            return NextResponse.json(
                { error: 'Creature not found' },
                { status: 404 }
            );
        }

        // For the card, we need the owner's other creatures for the "Manage Pairs" dialog.
        const allCreatures = await db.query.creatures.findMany({
            where: eq(creatures.userId, creature.userId),
        });

        return NextResponse.json({
            creature: enrichAndSerializeCreature(creature),
            allCreatures: allCreatures.map(enrichAndSerializeCreature),
        });
    } catch (error) {
        console.error('Failed to fetch creature details:', error);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}

// This function handles DELETE requests to /api/creatures/[creatureId]
export async function DELETE(
    req: Request,
    props: { params: Promise<{ creatureId: string }> }
) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    const { creatureId } = params;
    if (!creatureId) {
        return NextResponse.json(
            { error: 'Creature ID is required.' },
            { status: 400 }
        );
    }

    try {
        const result = await db
            .delete(creatures)
            .where(
                and(
                    eq(creatures.id, creatureId),
                    eq(creatures.userId, session.user.id)
                )
            )
            .returning(); // .returning() gives us back the row that was deleted

        if (result.length === 0) {
            return NextResponse.json(
                {
                    error: 'Creature not found or you do not have permission to delete it.',
                },
                { status: 404 }
            );
        }

        // Clear the cache for the collection page so the grid updates immediately
        revalidatePath('/collection');

        return NextResponse.json(
            { message: 'Creature deleted successfully.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Failed to delete creature:', error);
        // Handle potential foreign key constraint errors if a creature is part of a pair
        if ((error as any).code === '23503') {
            // PostgreSQL foreign key violation error code
            return NextResponse.json(
                {
                    error: 'Cannot delete this creature because it is part of an active breeding pair. Please remove it from the pair first.',
                },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
