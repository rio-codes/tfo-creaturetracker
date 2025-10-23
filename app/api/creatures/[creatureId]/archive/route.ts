import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs } from '@/src/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';

export async function PATCH(req: Request, props: { params: Promise<{ creatureId: string }> }) {
    const params = await props.params;
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
            const creatureToUpdate = await tx.query.creatures.findFirst({
                where: and(eq(creatures.id, creatureId), eq(creatures.userId, userId)),
                columns: { userId: true, code: true },
            });

            if (!creatureToUpdate) {
                return []; // Abort
            }

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
                                and(
                                    eq(breedingPairs.maleParentUserId, creatureToUpdate.userId),
                                    eq(breedingPairs.maleParentCode, creatureToUpdate.code)
                                ),
                                and(
                                    eq(breedingPairs.femaleParentUserId, creatureToUpdate.userId),
                                    eq(breedingPairs.femaleParentCode, creatureToUpdate.code)
                                )
                            )
                        )
                    );
            } else {
                // If un-archiving, find pairs where this creature is a parent.
                const pairsToConsider = await tx.query.breedingPairs.findMany({
                    where: and(
                        eq(breedingPairs.userId, userId),
                        or(
                            and(
                                eq(breedingPairs.maleParentUserId, creatureToUpdate.userId),
                                eq(breedingPairs.maleParentCode, creatureToUpdate.code)
                            ),
                            and(
                                eq(breedingPairs.femaleParentUserId, creatureToUpdate.userId),
                                eq(breedingPairs.femaleParentCode, creatureToUpdate.code)
                            )
                        )
                    ),
                    columns: {
                        id: true,
                        maleParentCode: true,
                        femaleParentCode: true,
                        maleParentUserId: true,
                        femaleParentUserId: true,
                    },
                });

                const pairsToUnarchive: string[] = [];
                if (pairsToConsider.length > 0) {
                    const otherParentIds = pairsToConsider
                        .map((p) =>
                            p.maleParentCode === creatureToUpdate.code
                                ? p.femaleParentCode
                                : p.maleParentCode
                        )
                        .filter((id): id is string => id !== null);

                    if (otherParentIds.length > 0) {
                        const otherParents = await tx.query.creatures.findMany({
                            where: and(
                                eq(creatures.userId, userId), // Make sure to only check the current user's creatures
                                inArray(creatures.code, otherParentIds)
                            ),
                            columns: { code: true, isArchived: true }, // We need the code to identify them later
                        });

                        const activeParentCodes = new Set(
                            otherParents.filter((p) => !p.isArchived).map((p) => p.code)
                        );

                        for (const pair of pairsToConsider) {
                            const otherParentId =
                                pair.maleParentCode === creatureToUpdate.code
                                    ? pair.femaleParentCode
                                    : pair.maleParentCode;

                            if (activeParentCodes.has(otherParentId)) {
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
