import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { breedingPairs, creatures, researchGoals, breedingLogEntries } from '@/src/db/schema';
import { hasObscenity } from '@/lib/obscenity';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray, or } from 'drizzle-orm';
import { validatePairing } from '@/lib/breeding-rules-client';
import { logUserAction } from '@/lib/user-actions';
import { logAdminAction } from '@/lib/audit';

const editPairSchema = z.object({
    pairName: z
        .string()
        .min(3, 'Pair name must be at least 3 characters.')
        .max(32, 'Pair name can not be more than 32 characters.'),
    maleParentUserId: z.string(),
    maleParentCode: z.string(),
    femaleParentUserId: z.string(),
    femaleParentCode: z.string(),
    assignedGoalIds: z.array(z.string().uuid()).optional(),
});

export async function PATCH(req: Request, props: { params: Promise<{ pairId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        console.log(body);
        const validatedFields = editPairSchema.safeParse(body);

        if (!validatedFields.success) {
            const { fieldErrors } = validatedFields.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const {
            pairName,
            maleParentUserId,
            maleParentCode,
            femaleParentUserId,
            femaleParentCode,
            assignedGoalIds,
        } = validatedFields.data;

        if (hasObscenity(pairName)) {
            return NextResponse.json(
                {
                    error: 'The provided name contains inappropriate language.',
                },
                { status: 400 }
            );
        }

        const existingPair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.id, params.pairId),
                eq(breedingPairs.userId, session.user.id)
            ),
        });

        if (!existingPair) {
            return NextResponse.json({ error: 'Breeding pair not found.' }, { status: 404 });
        }

        const [maleParent, femaleParent] = await Promise.all([
            db.query.creatures.findFirst({
                where: and(
                    eq(creatures.userId, maleParentUserId),
                    eq(creatures.code, maleParentCode)
                ),
            }),
            db.query.creatures.findFirst({
                where: and(
                    eq(creatures.userId, femaleParentUserId),
                    eq(creatures.code, femaleParentCode)
                ),
            }),
        ]);

        if (!maleParent || !femaleParent) {
            return NextResponse.json(
                {
                    error: 'One or both selected parents could not be found.',
                },
                { status: 404 }
            );
        }

        const pairingValidation = validatePairing(maleParent, femaleParent);
        if (!pairingValidation.isValid) {
            return NextResponse.json({ error: pairingValidation.error }, { status: 400 });
        }

        const parentsHaveChanged =
            maleParentUserId !== existingPair.maleParentUserId ||
            maleParentCode !== existingPair.maleParentCode ||
            femaleParentUserId !== existingPair.femaleParentUserId ||
            femaleParentCode !== existingPair.femaleParentCode;

        if (parentsHaveChanged) {
            const duplicatePair = await db.query.breedingPairs.findFirst({
                where: and(
                    eq(breedingPairs.userId, session.user.id),
                    eq(breedingPairs.maleParentUserId, maleParentUserId),
                    eq(breedingPairs.maleParentCode, maleParentCode)
                ),
            });

            if (duplicatePair) {
                return NextResponse.json(
                    { error: 'A breeding pair with these parents already exists.' },
                    { status: 409 }
                );
            }
        }

        if (assignedGoalIds && assignedGoalIds.length > 0) {
            const goals = await db
                .select()
                .from(researchGoals)
                .where(
                    and(
                        inArray(researchGoals.id, assignedGoalIds),
                        eq(researchGoals.userId, session.user.id)
                    )
                );
            if (goals.length !== assignedGoalIds.length) {
                return NextResponse.json(
                    {
                        error: 'One or more selected goals could not be found.',
                    },
                    { status: 404 }
                );
            }
            for (const goal of goals) {
                if (goal.species !== maleParent.species || goal.species !== femaleParent.species) {
                    return NextResponse.json(
                        {
                            error: `The goal "${goal.name}" cannot be assigned to a ${maleParent.species} pair.`,
                        },
                        { status: 400 }
                    );
                }
            }
        }

        const result = await db
            .update(breedingPairs)
            .set({
                pairName,
                maleParentUserId,
                maleParentCode,
                femaleParentUserId,
                femaleParentCode,
                assignedGoalIds: assignedGoalIds || [],
                updatedAt: new Date(),
            })
            .where(
                and(eq(breedingPairs.id, params.pairId), eq(breedingPairs.userId, session.user.id))
            )
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                {
                    error: 'Pair not found or you do not have permission to edit it.',
                },
                { status: 404 }
            );
        }

        if (session.user.role === 'admin') {
            await logAdminAction({
                action: 'breeding_pair.edit',
                targetType: 'breeding_pair',
                targetId: params.pairId,
                targetUserId: existingPair.userId,
                details: {
                    updatedFields: Object.keys(validatedFields.data),
                },
            });
        }

        // --- Synchronize Goal Assignments ---
        const oldGoalIds = new Set(existingPair.assignedGoalIds || []);
        const newGoalIds = new Set(assignedGoalIds || []);

        const goalsAdded = [...newGoalIds].filter((id) => !oldGoalIds.has(id));
        const goalsRemoved = [...oldGoalIds].filter((id) => !newGoalIds.has(id));

        // Update goals that had this pair added
        if (goalsAdded.length > 0) {
            const goalsToUpdate = await db.query.researchGoals.findMany({
                where: and(
                    inArray(researchGoals.id, goalsAdded),
                    eq(researchGoals.userId, session.user.id)
                ),
            });
            for (const goal of goalsToUpdate) {
                const currentPairIds = new Set(goal.assignedPairIds || []);
                currentPairIds.add(params.pairId);
                await db
                    .update(researchGoals)
                    .set({ assignedPairIds: Array.from(currentPairIds) })
                    .where(eq(researchGoals.id, goal.id));
                revalidatePath(`/research-goals/${goal.id}`);
            }
        }

        // Update goals that had this pair removed
        if (goalsRemoved.length > 0) {
            const goalsToUpdate = await db.query.researchGoals.findMany({
                where: and(
                    inArray(researchGoals.id, goalsRemoved),
                    eq(researchGoals.userId, session.user.id)
                ),
            });
            for (const goal of goalsToUpdate) {
                const currentPairIds = new Set(goal.assignedPairIds || []);
                currentPairIds.delete(params.pairId);
                await db
                    .update(researchGoals)
                    .set({ assignedPairIds: Array.from(currentPairIds) })
                    .where(eq(researchGoals.id, goal.id));
                revalidatePath(`/research-goals/${goal.id}`);
            }
        }

        revalidatePath('/breeding-pairs');
        revalidatePath('/research-goals');

        // TODO: Specify in logUserAction which properties were changes
        await logUserAction({
            action: 'pair.update',
            description: `Updated breeding pair "${pairName}"`,
        });

        return NextResponse.json({
            message: 'Breeding pair updated successfully!',
        });
    } catch (error: any) {
        console.error('Failed to update breeding pair:', error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ pairId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const progenyIdToRemove = searchParams.get('progenyId');

    try {
        if (progenyIdToRemove) {
            // Logic to remove a single progeny from a log entry
            const logEntriesToUpdate = await db
                .select()
                .from(breedingLogEntries)
                .where(
                    and(
                        eq(breedingLogEntries.userId, userId),
                        eq(breedingLogEntries.pairId, params.pairId),
                        or(
                            and(
                                eq(breedingLogEntries.progeny1UserId, userId),
                                eq(breedingLogEntries.progeny1Code, progenyIdToRemove)
                            ),
                            and(
                                eq(breedingLogEntries.progeny2UserId, userId),
                                eq(breedingLogEntries.progeny2Code, progenyIdToRemove)
                            )
                        )
                    )
                );

            if (logEntriesToUpdate.length === 0) {
                return NextResponse.json(
                    { error: 'Progeny log entry not found.' },
                    { status: 404 }
                );
            }

            for (const logEntry of logEntriesToUpdate) {
                const updateData: {
                    progeny1UserId?: string | null;
                    progeny1Code?: string | null;
                    progeny2UserId?: string | null;
                    progeny2Code?: string | null;
                } = {};
                if (logEntry.progeny1Code === progenyIdToRemove) {
                    updateData.progeny1UserId = null;
                    updateData.progeny1Code = null;
                }
                if (logEntry.progeny2Code === progenyIdToRemove) {
                    updateData.progeny2UserId = null;
                    updateData.progeny2Code = null;
                }

                if (Object.keys(updateData).length > 0) {
                    await db
                        .update(breedingLogEntries)
                        .set(updateData)
                        .where(eq(breedingLogEntries.id, logEntry.id));
                }
            }

            revalidatePath('/breeding-pairs');
            revalidatePath('/research-goals', 'layout');

            return NextResponse.json({
                message: 'Progeny removed successfully.',
            });
        } else {
            // Original logic to delete the entire pair
            const result = await db
                .delete(breedingPairs)
                .where(and(eq(breedingPairs.id, params.pairId), eq(breedingPairs.userId, userId)))
                .returning();

            if (result.length === 0) {
                return NextResponse.json(
                    {
                        error: 'Pair not found or you do not have permission to delete it.',
                    },
                    { status: 404 }
                );
            }

            if (session.user.role === 'admin') {
                await logAdminAction({
                    action: 'breeding_pair.delete',
                    targetType: 'breeding_pair',
                    targetId: params.pairId,
                    targetUserId: result[0].userId,
                    details: { pairName: result[0].pairName, deletedByAdmin: true },
                });
            }
            revalidatePath('/breeding-pairs');

            await logUserAction({
                action: 'pair.delete',
                description: `Deleted breeding pair "${result[0].pairName}"`,
            });

            return NextResponse.json({
                message: 'Breeding pair deleted successfully.',
            });
        }
    } catch (error: any) {
        console.error('Failed to process DELETE request:', error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
