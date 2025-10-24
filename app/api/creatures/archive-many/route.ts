import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs, researchGoals } from '@/src/db/schema'; // Import researchGoals
import { and, or, eq, inArray, sql } from 'drizzle-orm'; // Import sql
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;
    const { creatureIds } = await req.json();

    try {
        await db.transaction(async (tx) => {
            const creaturesToArchive = await tx
                .select({ userId: creatures.userId, code: creatures.code })
                .from(creatures)
                .where(and(eq(creatures.userId, userId), inArray(creatures.id, creatureIds)));

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

                const pairsToArchive = await tx
                    .select({ id: breedingPairs.id })
                    .from(breedingPairs)
                    .where(and(eq(breedingPairs.userId, userId), or(...orConditions)));

                if (pairsToArchive.length > 0) {
                    const pairIdsToArchive = pairsToArchive.map((p) => p.id);

                    // Archive the pairs
                    await tx
                        .update(breedingPairs)
                        .set({ isArchived: true })
                        .where(inArray(breedingPairs.id, pairIdsToArchive));

                    // Find and update goals
                    const goalsToUpdate = await tx
                        .select()
                        .from(researchGoals)
                        .where(
                            and(
                                eq(researchGoals.userId, userId),
                                sql`${researchGoals.assignedPairIds} ?| ${pairIdsToArchive}`
                            )
                        );

                    for (const goal of goalsToUpdate) {
                        const updatedAssignedIds =
                            goal.assignedPairIds?.filter((id) => !pairIdsToArchive.includes(id)) ||
                            [];
                        await tx
                            .update(researchGoals)
                            .set({ assignedPairIds: updatedAssignedIds })
                            .where(eq(researchGoals.id, goal.id));
                    }
                }
            }
        });

        revalidatePath('/breeding-pairs');
        revalidatePath('/collection');
        revalidatePath('/research-goals');

        return NextResponse.json({ message: 'Creatures archived successfully.' });
    } catch (error) {
        console.error('Failed to archive creatures:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
