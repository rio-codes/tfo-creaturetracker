import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
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

        revalidatePath('/collection');

        return NextResponse.json({ message: 'Creatures archived successfully.' });
    } catch (error) {
        console.error('Failed to archive creatures:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
