import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs } from '@/src/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';

export async function PATCH(req: Request, { params }: { params: { creatureId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    const { creatureId } = params;
    if (!creatureId) {
        return NextResponse.json({ error: 'Creature ID is required.' }, { status: 400 });
    }

    const { isArchived } = await req.json();
    if (typeof isArchived !== 'boolean') {
        return NextResponse.json({ error: 'Invalid "isArchived" value.' }, { status: 400 });
    }

    try {
        const result = await db.transaction(async (tx) => {
            const updateResult = await tx
                .update(creatures)
                .set({ isArchived, updatedAt: new Date() })
                .where(and(eq(creatures.id, creatureId), eq(creatures.userId, userId)))
                .returning();

            if (updateResult.length === 0) {
                return []; // Abort transaction
            }

            if (isArchived) {
                // If archiving a creature, archive all its pairs.
                await tx
                    .update(breedingPairs)
                    .set({ isArchived: true })
                    .where(
                        and(
                            eq(breedingPairs.userId, userId),
                            or(
                                eq(breedingPairs.maleParentId, creatureId),
                                eq(breedingPairs.femaleParentId, creatureId)
                            )
                        )
                    );
            } else {
                // If un-archiving, find pairs where this creature is a parent.
                const pairsToConsider = await tx.query.breedingPairs.findMany({
                    where: and(
                        eq(breedingPairs.userId, userId),
                        or(
                            eq(breedingPairs.maleParentId, creatureId),
                            eq(breedingPairs.femaleParentId, creatureId)
                        )
                    ),
                    columns: { id: true, maleParentId: true, femaleParentId: true },
                });

                const pairsToUnarchive: string[] = [];
                if (pairsToConsider.length > 0) {
                    const otherParentIds = pairsToConsider
                        .map((p) =>
                            p.maleParentId === creatureId ? p.femaleParentId : p.maleParentId
                        )
                        .filter((id): id is string => id !== null);

                    if (otherParentIds.length > 0) {
                        const otherParents = await tx.query.creatures.findMany({
                            where: inArray(creatures.id, otherParentIds),
                            columns: { id: true, isArchived: true },
                        });

                        const activeParentIds = new Set(
                            otherParents.filter((p) => !p.isArchived).map((p) => p.id)
                        );

                        for (const pair of pairsToConsider) {
                            const otherParentId =
                                pair.maleParentId === creatureId
                                    ? pair.femaleParentId
                                    : pair.maleParentId;
                            if (activeParentIds.has(otherParentId)) {
                                pairsToUnarchive.push(pair.id);
                            }
                        }
                    }
                }

                if (pairsToUnarchive.length > 0) {
                    await tx
                        .update(breedingPairs)
                        .set({ isArchived: false })
                        .where(inArray(breedingPairs.id, pairsToUnarchive));
                }
            }
            return updateResult;
        });

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Creature not found or you do not have permission to modify it.' },
                { status: 404 }
            );
        }

        revalidatePath('/breeding-pairs');
        revalidatePath('/collection');

        const creature = await db.query.creatures.findFirst({
            where: eq(creatures.id, creatureId),
        });

        await logUserAction({
            action: 'creature.update',
            description: `Updated creature "${creature?.creatureName} (${creature?.code})" archive status to ${isArchived ? 'archived' : 'un-archived'}`,
        });

        return NextResponse.json({
            message: `Creature ${isArchived ? 'archived' : 'un-archived'} successfully.`,
        });
    } catch (error) {
        console.error('Failed to update creature archive status:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
