import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs } from '@/src/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { creatureIds } = await req.json();

        if (!Array.isArray(creatureIds) || creatureIds.length === 0) {
            return NextResponse.json({ error: 'Creature IDs are required.' }, { status: 400 });
        }

        await db
            .update(creatures)
            .set({ isArchived: true, updatedAt: new Date() })
            .where(and(eq(creatures.userId, session.user.id), inArray(creatures.id, creatureIds)));

        await db
            .update(breedingPairs)
            .set({ isArchived: true })
            .where(
                and(
                    eq(breedingPairs.userId, session.user.id),
                    inArray(breedingPairs.maleParentId, creatureIds)
                )
            );

        revalidatePath('/breeding-pairs');
        revalidatePath('/collection');

        return NextResponse.json({ message: 'Creatures archived successfully.' });
    } catch (error) {
        console.error('Failed to archive creatures:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
