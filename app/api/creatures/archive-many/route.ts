import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs } from '@/src/db/schema';
import { and, or, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { creatureIds } = await req.json();

    try {
        const creaturesToArchive = await db
            .select({ userId: creatures.userId, code: creatures.code })
            .from(creatures)
            .where(and(eq(creatures.userId, session.user.id), inArray(creatures.id, creatureIds)));

        if (creaturesToArchive.length > 0) {
            const orConditions = creaturesToArchive.map((c) =>
                or(
                    and(
                        eq(breedingPairs.maleParentUserId, c.userId),
                        eq(breedingPairs.maleParentCode, c.code)
                    ),
                    and(
                        eq(breedingPairs.femaleParentUserId, c.userId),
                        eq(breedingPairs.femaleParentCode, c.code)
                    )
                )
            );

            await db
                .update(breedingPairs)
                .set({ isArchived: true })
                .where(and(eq(breedingPairs.userId, session.user.id), or(...orConditions)));
        }

        revalidatePath('/breeding-pairs');
        revalidatePath('/collection');

        return NextResponse.json({ message: 'Creatures archived successfully.' });
    } catch (error) {
        console.error('Failed to archive creatures:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
