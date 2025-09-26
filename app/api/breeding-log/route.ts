import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import {
    breedingLogEntries,
    researchGoals,
    creatures,
    achievedGoals,
    breedingPairs,
} from '@/src/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { checkGoalAchieved } from '@/lib/breeding-rules';
import { hasObscenity } from '@/lib/obscenity';
import { logUserAction } from '@/lib/user-actions';

const createLogSchema = z.object({
    pairId: z.string().uuid('Invalid pair ID'),
    progeny1Id: z.string().uuid('Invalid progeny ID').nullable().optional(),
    progeny2Id: z.string().uuid('Invalid progeny ID').nullable().optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
    sourceLogId: z.string().uuid().optional(),
    keepSourceOnEmpty: z.boolean().optional(),
});

const editLogSchema = z.object({
    logId: z.string().uuid('Invalid log ID'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
    progeny1Id: z.string().uuid('Invalid progeny ID').nullable().optional(),
    progeny2Id: z.string().uuid('Invalid progeny ID').nullable().optional(),
});

const updateLogSchema = z.object({
    logEntryId: z.string().uuid('Invalid log entry ID'),
    progenyId: z.string().uuid('Invalid progeny ID'),
    sourceLogId: z.string().uuid().optional(),
    keepSourceOnEmpty: z.boolean().optional(),
});

const deleteLogSchema = z.object({
    logId: z.string().uuid('Invalid log ID'),
});

async function checkAndRecordAchievements(
    userId: string,
    pairId: string,
    progenyIds: string[],
    logEntryId: string
) {
    if (progenyIds.length === 0) return;

    const pair = await db.query.breedingPairs.findFirst({
        where: and(eq(breedingPairs.id, pairId), eq(breedingPairs.userId, userId)),
    });

    if (pair && pair.assignedGoalIds && pair.assignedGoalIds.length > 0) {
        const assignedGoals = await db.query.researchGoals.findMany({
            where: and(
                inArray(researchGoals.id, pair.assignedGoalIds),
                eq(researchGoals.userId, userId)
            ),
        });
        const progenyCreatures = await db.query.creatures.findMany({
            where: and(inArray(creatures.id, progenyIds), eq(creatures.userId, userId)),
        });

        for (const progeny of progenyCreatures) {
            for (const goal of assignedGoals) {
                if (progeny.species !== goal.species) continue;

                const isAchieved = checkGoalAchieved(progeny, goal);
                if (isAchieved) {
                    const existingAchievement = await db.query.achievedGoals.findFirst({
                        where: and(
                            eq(achievedGoals.goalId, goal.id),
                            eq(achievedGoals.matchingProgenyId, progeny.id)
                        ),
                    });
                    if (!existingAchievement) {
                        await db.insert(achievedGoals).values({
                            userId,
                            goalId: goal.id,
                            logEntryId: logEntryId,
                            matchingProgenyId: progeny.id,
                            achievedAt: new Date(),
                        });
                        revalidatePath(`/research-goals/${goal.id}`);
                    }
                }
            }
        }
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = createLogSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { pairId, progeny1Id, progeny2Id, notes, sourceLogId, keepSourceOnEmpty } =
            validated.data;

        if (hasObscenity(notes)) {
            return NextResponse.json(
                { error: 'The provided notes contain inappropriate language.' },
                { status: 400 }
            );
        }

        const pair = await db.query.breedingPairs.findFirst({
            where: and(eq(breedingPairs.id, pairId), eq(breedingPairs.userId, userId)),
        });
        if (!pair) {
            return NextResponse.json({ error: 'Breeding pair not found' }, { status: 404 });
        }

        const [newLogEntry] = await db.transaction(async (tx) => {
            if (sourceLogId) {
                const sourceLog = await tx.query.breedingLogEntries.findFirst({
                    where: and(
                        eq(breedingLogEntries.id, sourceLogId),
                        eq(breedingLogEntries.userId, userId)
                    ),
                });

                if (!sourceLog) throw new Error('Source log entry not found.');

                const progenyToRemoveId = progeny1Id || progeny2Id;
                const updateData =
                    sourceLog.progeny1Id === progenyToRemoveId
                        ? { progeny1Id: null }
                        : { progeny2Id: null };

                await tx
                    .update(breedingLogEntries)
                    .set(updateData)
                    .where(eq(breedingLogEntries.id, sourceLogId));

                const updatedSourceLog = { ...sourceLog, ...updateData };
                const isSourceEmpty = !updatedSourceLog.progeny1Id && !updatedSourceLog.progeny2Id;

                if (isSourceEmpty && !keepSourceOnEmpty) {
                    await tx
                        .delete(breedingLogEntries)
                        .where(eq(breedingLogEntries.id, sourceLogId));
                }
            }

            return await tx
                .insert(breedingLogEntries)
                .values({
                    userId,
                    pairId,
                    progeny1Id: progeny1Id || null,
                    progeny2Id: progeny2Id || null,
                    notes,
                    createdAt: new Date(),
                })
                .returning();
        });

        // --- Check for achieved goals ---
        const newProgenyIds = [progeny1Id, progeny2Id].filter((id): id is string => !!id);
        await checkAndRecordAchievements(userId, pairId, newProgenyIds, newLogEntry.id);

        revalidatePath('/breeding-pairs');
        revalidatePath('/collection');

        await logUserAction({
            action: 'log.create',
            description: `Logged a new breeding event for pair "${pair.pairName}"`,
        });

        return NextResponse.json(
            { message: 'Breeding event logged successfully!' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Failed to log breeding event:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An internal error occurred.',
            },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = editLogSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { logId, notes, progeny1Id, progeny2Id } = validated.data;

        if (hasObscenity(notes)) {
            return NextResponse.json(
                { error: 'The provided notes contain inappropriate language.' },
                { status: 400 }
            );
        }

        await db.transaction(async (tx) => {
            const existingLog = await tx.query.breedingLogEntries.findFirst({
                where: and(eq(breedingLogEntries.id, logId), eq(breedingLogEntries.userId, userId)),
            });

            if (!existingLog) {
                throw new Error('Log entry not found.');
            }

            const oldProgenyIds = [existingLog.progeny1Id, existingLog.progeny2Id].filter(
                Boolean
            ) as string[];
            const newProgenyIds = [progeny1Id, progeny2Id].filter(Boolean) as string[];

            const removedProgenyIds = oldProgenyIds.filter((id) => !newProgenyIds.includes(id));

            // Delete achievements for removed progeny from this log
            if (removedProgenyIds.length > 0) {
                await tx
                    .delete(achievedGoals)
                    .where(
                        and(
                            eq(achievedGoals.logEntryId, logId),
                            inArray(achievedGoals.matchingProgenyId, removedProgenyIds)
                        )
                    );
            }

            // Update the log entry
            await tx
                .update(breedingLogEntries)
                .set({
                    notes: notes,
                    progeny1Id: progeny1Id,
                    progeny2Id: progeny2Id,
                })
                .where(eq(breedingLogEntries.id, logId));

            // Check for new achievements
            await checkAndRecordAchievements(userId, existingLog.pairId, newProgenyIds, logId);

            const pair = await db.query.breedingPairs.findFirst({
                where: and(
                    eq(breedingPairs.id, existingLog.pairId),
                    eq(breedingPairs.userId, userId)
                ),
            });

            await logUserAction({
                action: 'log.update',
                description: `Updated breeding event for pair "${pair?.pairName}"`,
            });
        });

        revalidatePath('/breeding-pairs');
        revalidatePath('/collection');

        return NextResponse.json({ message: 'Log entry updated successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Failed to update breeding log:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An internal error occurred.',
            },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = deleteLogSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { logId } = validated.data;

        await db.transaction(async (tx) => {
            const logToDelete = await tx.query.breedingLogEntries.findFirst({
                where: and(eq(breedingLogEntries.id, logId), eq(breedingLogEntries.userId, userId)),
            });
            if (!logToDelete) {
                throw new Error('Log entry not found or you do not have permission to delete it.');
            }

            // Delete associated achievements
            await tx.delete(achievedGoals).where(eq(achievedGoals.logEntryId, logId));

            // Delete the log entry
            await tx.delete(breedingLogEntries).where(eq(breedingLogEntries.id, logId));

            const pair = await db.query.breedingPairs.findFirst({
                where: and(
                    eq(breedingPairs.id, logToDelete.pairId),
                    eq(breedingPairs.userId, userId)
                ),
            });

            await logUserAction({
                action: 'log.delete',
                description: `Deleted breeding event on ${logToDelete.createdAt} for pair "${pair?.pairName}"`,
            });
        });

        revalidatePath('/breeding-pairs');
        revalidatePath('/collection');

        return NextResponse.json({ message: 'Log entry deleted successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Failed to delete breeding log:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An internal error occurred.',
            },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = updateLogSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { logEntryId, progenyId, sourceLogId, keepSourceOnEmpty } = validated.data;

        if (sourceLogId && sourceLogId === logEntryId) {
            return NextResponse.json(
                { error: 'Cannot move progeny to the same log entry.' },
                { status: 400 }
            );
        }

        let sourcePair = null;
        let progenyCreature1 = null;
        let progenyCreature2 = null;

        if (sourceLogId) {
            const sourceLog = await db.query.breedingLogEntries.findFirst({
                where: and(
                    eq(breedingLogEntries.id, sourceLogId),
                    eq(breedingLogEntries.userId, userId)
                ),
            });

            if (sourceLog) {
                sourcePair = await db.query.breedingPairs.findFirst({
                    where: and(
                        eq(breedingPairs.id, sourceLog.pairId),
                        eq(breedingPairs.userId, userId)
                    ),
                });

                progenyCreature1 = sourceLog.progeny1Id
                    ? await db.query.creatures.findFirst({
                          where: and(
                              eq(creatures.id, sourceLog.progeny1Id),
                              eq(creatures.userId, userId)
                          ),
                      })
                    : null;
                progenyCreature2 = sourceLog.progeny2Id
                    ? await db.query.creatures.findFirst({
                          where: and(
                              eq(creatures.id, sourceLog.progeny2Id),
                              eq(creatures.userId, userId)
                          ),
                      })
                    : null;
            }
        }

        await db.transaction(async (tx) => {
            if (sourceLogId) {
                const sourceLog = await tx.query.breedingLogEntries.findFirst({
                    where: and(
                        eq(breedingLogEntries.id, sourceLogId),
                        eq(breedingLogEntries.userId, userId)
                    ),
                });

                if (!sourceLog) throw new Error('Source log entry not found.');

                const updateData =
                    sourceLog.progeny1Id === progenyId
                        ? { progeny1Id: null }
                        : { progeny2Id: null };

                await tx
                    .update(breedingLogEntries)
                    .set(updateData)
                    .where(eq(breedingLogEntries.id, sourceLogId));

                const updatedSourceLog = { ...sourceLog, ...updateData };
                const isSourceEmpty = !updatedSourceLog.progeny1Id && !updatedSourceLog.progeny2Id;

                if (isSourceEmpty && !keepSourceOnEmpty) {
                    await tx
                        .delete(breedingLogEntries)
                        .where(eq(breedingLogEntries.id, sourceLogId));
                }
            }

            const destinationLog = await tx.query.breedingLogEntries.findFirst({
                where: and(
                    eq(breedingLogEntries.id, logEntryId),
                    eq(breedingLogEntries.userId, userId)
                ),
            });

            if (!destinationLog) {
                throw new Error('Destination log entry not found.');
            }

            if (destinationLog.progeny1Id && destinationLog.progeny2Id) {
                throw new Error('Destination log entry is already full.');
            }

            if (
                destinationLog.progeny1Id === progenyId ||
                destinationLog.progeny2Id === progenyId
            ) {
                throw new Error('Progeny already in this log entry.');
            }

            const updateData =
                destinationLog.progeny1Id === null
                    ? { progeny1Id: progenyId }
                    : { progeny2Id: progenyId };
            await tx
                .update(breedingLogEntries)
                .set(updateData)
                .where(eq(breedingLogEntries.id, logEntryId));

            await checkAndRecordAchievements(
                userId,
                destinationLog.pairId,
                [progenyId],
                logEntryId
            );

            const destinationPair = await db.query.breedingPairs.findFirst({
                where: and(
                    eq(breedingPairs.id, destinationLog.pairId),
                    eq(breedingPairs.userId, userId)
                ),
            });

            if (sourcePair && destinationPair && (progenyCreature1 || progenyCreature2)) {
                await logUserAction({
                    action: 'log.progeny.move',
                    description: `Moved progeny ${progenyCreature1?.creatureName || progenyCreature2?.creatureName} from log entry for pair "${sourcePair?.pairName}" to log entry for pair ${destinationPair?.pairName}`,
                });
            }
        });

        revalidatePath('/breeding-pairs');
        revalidatePath('/collection');

        return NextResponse.json(
            { message: 'Progeny added to log successfully!' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Failed to update breeding log with new progeny:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An internal error occurred.',
            },
            { status: 500 }
        );
    }
}
