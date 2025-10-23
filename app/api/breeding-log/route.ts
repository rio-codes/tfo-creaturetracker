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
import { and, or, eq, inArray } from 'drizzle-orm';
import { checkGoalAchieved } from '@/lib/breeding-rules';
import { hasObscenity } from '@/lib/obscenity';
import { logUserAction } from '@/lib/user-actions';
import { calculateGeneration } from '@/lib/creature-utils';
import { CreatureKey } from '../../../types/index';

const createLogSchema = z.object({
    pairId: z.string().uuid('Invalid pair ID'),
    progeny1UserId: z.string().nullable().optional(),
    progeny1Code: z.string().nullable().optional(),
    progeny2UserId: z.string().nullable().optional(),
    progeny2Code: z.string().nullable().optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
    sourceLogId: z.string().uuid().optional(),
    keepSourceOnEmpty: z.boolean().optional(),
});

const editLogSchema = z.object({
    logId: z.string().uuid('Invalid log ID'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
    progeny1UserId: z.string().nullable().optional(),
    progeny1Code: z.string().nullable().optional(),
    progeny2UserId: z.string().nullable().optional(),
    progeny2Code: z.string().nullable().optional(),
});

const updateLogSchema = z.object({
    logEntryId: z.string().uuid('Invalid log entry ID'),
    progenyUserId: z.string(),
    progenyCode: z.string(),
    sourceLogId: z.string().uuid().optional(),
    keepSourceOnEmpty: z.boolean().optional(),
});

const deleteLogSchema = z.object({
    logId: z.string().uuid('Invalid log ID'),
});

async function checkAndRecordAchievements(
    userId: string,
    pairId: string,
    progenyKeys: { userId: string; code: string }[],
    logEntryId: string
) {
    if (progenyKeys.length === 0) return;

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
        const progenyCreatures =
            progenyKeys.length > 0
                ? await db.query.creatures.findMany({
                      where: or(
                          ...progenyKeys.map((k) =>
                              and(eq(creatures.userId, k.userId), eq(creatures.code, k.code))
                          )
                      ),
                  })
                : [];

        for (const progeny of progenyCreatures) {
            for (const goal of assignedGoals) {
                if (progeny.species !== goal.species) continue;

                const isAchieved = checkGoalAchieved(progeny, goal);
                if (isAchieved) {
                    const existingAchievement = await db.query.achievedGoals.findFirst({
                        where: and(
                            eq(achievedGoals.goalId, goal.id),
                            eq(achievedGoals.matchingProgenyUserId, progeny.userId),
                            eq(achievedGoals.matchingProgenyCode, progeny.code)
                        ),
                    });
                    if (!existingAchievement) {
                        await db.insert(achievedGoals).values({
                            userId,
                            goalId: goal.id,
                            logEntryId: logEntryId,
                            matchingProgenyUserId: progeny.userId,
                            matchingProgenyId: progeny.id,
                            matchingProgenyCode: progeny.code,
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

        const {
            pairId,
            progeny1UserId,
            progeny1Code,
            progeny2UserId,
            progeny2Code,
            notes,
            sourceLogId,
            keepSourceOnEmpty,
        } = validated.data;

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

                const progenyToRemoveCode = progeny1Code || progeny2Code;
                const updateData: {
                    progeny1UserId?: string | null;
                    progeny1Code?: string | null;
                    progeny2UserId?: string | null;
                    progeny2Code?: string | null;
                } =
                    sourceLog.progeny1Code === progenyToRemoveCode
                        ? { progeny1UserId: null, progeny1Code: null }
                        : { progeny2UserId: null, progeny2Code: null };

                await tx
                    .update(breedingLogEntries)
                    .set(updateData)
                    .where(eq(breedingLogEntries.id, sourceLogId));

                const updatedSourceLog = { ...sourceLog, ...updateData };
                const isSourceEmpty =
                    !updatedSourceLog.progeny1Code && !updatedSourceLog.progeny2Code;

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
                    progeny1UserId,
                    progeny1Code,
                    progeny2UserId,
                    progeny2Code,
                    notes,
                    createdAt: new Date(),
                })
                .returning();
        });

        const newProgenyKeys: { userId: string; code: string }[] = [];
        if (progeny1UserId && progeny1Code)
            newProgenyKeys.push({ userId: progeny1UserId, code: progeny1Code });
        if (progeny2UserId && progeny2Code)
            newProgenyKeys.push({ userId: progeny2UserId, code: progeny2Code });

        await checkAndRecordAchievements(userId, pairId, newProgenyKeys, newLogEntry.id);

        const newProgenyIds = newProgenyKeys.map((k) => k.code); // For the inArray update later

        if (newProgenyIds.length > 0) {
            const parentPair = await db.query.breedingPairs.findFirst({
                where: and(eq(breedingPairs.id, pairId), eq(breedingPairs.userId, userId)),
                with: { maleParent: true, femaleParent: true },
            });

            if (parentPair?.maleParent && parentPair?.femaleParent) {
                const newGeneration =
                    Math.max(
                        parentPair.maleParent.generation ?? 1,
                        parentPair.femaleParent.generation ?? 1
                    ) + 1;

                const updateConditions = newProgenyKeys.map((key) =>
                    and(eq(creatures.userId, key.userId), eq(creatures.code, key.code))
                );

                await db
                    .update(creatures)
                    .set({ generation: newGeneration, origin: 'bred' })
                    .where(or(...updateConditions));
            }

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
        }
    } catch (error) {
        console.error('Failed to log breeding event:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An internal error occurred.' },
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

        const { logId, progeny1UserId, progeny1Code, progeny2UserId, progeny2Code, notes } =
            validated.data;

        if (hasObscenity(notes)) {
            return NextResponse.json(
                { error: 'The provided notes contain inappropriate language.' },
                { status: 400 }
            );
        }

        await db.transaction(async (tx) => {
            const existingLog = await tx.query.breedingLogEntries.findFirst({
                where: and(
                    eq(breedingLogEntries.id, validated.data.logId),
                    eq(breedingLogEntries.userId, userId)
                ),
            });

            if (!existingLog) {
                throw new Error('Log entry not found.');
            }

            const oldProgenyKeys: { userId: string; code: string }[] = [];
            if (existingLog.progeny1UserId && existingLog.progeny1Code)
                oldProgenyKeys.push({
                    userId: existingLog.progeny1UserId,
                    code: existingLog.progeny1Code,
                });
            if (existingLog.progeny2UserId && existingLog.progeny2Code)
                oldProgenyKeys.push({
                    userId: existingLog.progeny2UserId,
                    code: existingLog.progeny2Code,
                });

            const newProgenyKeys: { userId: string; code: string }[] = [];
            if (progeny1UserId && progeny1Code)
                newProgenyKeys.push({ userId: progeny1UserId, code: progeny1Code });
            if (progeny2UserId && progeny2Code)
                newProgenyKeys.push({ userId: progeny2UserId, code: progeny2Code });

            const newProgenyKeysSet = new Set(newProgenyKeys.map((k) => `${k.userId}-${k.code}`));
            const removedProgenyKeys = oldProgenyKeys.filter(
                (k) => !newProgenyKeysSet.has(`${k.userId}-${k.code}`)
            );

            // Delete achievements for removed progeny from this log
            if (removedProgenyKeys.length > 0) {
                const removedConditions = removedProgenyKeys.map((k) =>
                    and(
                        eq(achievedGoals.matchingProgenyUserId, k.userId),
                        eq(achievedGoals.matchingProgenyCode, k.code)
                    )
                );
                await tx
                    .delete(achievedGoals)
                    .where(and(eq(achievedGoals.logEntryId, logId), or(...removedConditions)));
            }

            // Update the log entry
            await tx
                .update(breedingLogEntries)
                .set({
                    notes: notes,
                    progeny1UserId: progeny1UserId,
                    progeny1Code: progeny1Code,
                    progeny2UserId: progeny2UserId,
                    progeny2Code: progeny2Code,
                })
                .where(eq(breedingLogEntries.id, logId));

            // Check for new achievements
            await checkAndRecordAchievements(userId, existingLog.pairId, newProgenyKeys, logId);

            if (newProgenyKeys.length > 0) {
                const parentPair = await tx.query.breedingPairs.findFirst({
                    where: and(
                        eq(breedingPairs.id, existingLog.pairId),
                        eq(breedingPairs.userId, userId)
                    ),
                    with: { maleParent: true, femaleParent: true },
                });

                if (parentPair?.maleParent && parentPair?.femaleParent) {
                    const newGeneration =
                        Math.max(
                            parentPair.maleParent.generation ?? 1,
                            parentPair.femaleParent.generation ?? 1
                        ) + 1;

                    const updateConditions = newProgenyKeys.map((key) =>
                        and(eq(creatures.userId, key.userId), eq(creatures.code, key.code))
                    );

                    await tx
                        .update(creatures)
                        .set({ generation: newGeneration, origin: 'bred' })
                        .where(or(...updateConditions));
                }

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

                revalidatePath('/breeding-pairs');
                revalidatePath('/collection');

                return NextResponse.json(
                    { message: 'Log entry updated successfully!' },
                    { status: 200 }
                );
            }
        });
    } catch (error) {
        console.error('Failed to update breeding log:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An internal error occurred.' },
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

        const { logEntryId, progenyUserId, progenyCode, sourceLogId, keepSourceOnEmpty } =
            validated.data;

        if (sourceLogId && sourceLogId === logEntryId) {
            return NextResponse.json(
                { error: 'Cannot move progeny to the same log entry.' },
                { status: 400 }
            );
        }

        let sourcePair = null;
        let progenyCreature1: CreatureKey | null = null; // Initialize as null
        let progenyCreature2: CreatureKey | null = null; // Initialize as null

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

                // Check if progeny1Code exists before querying and assigning
                if (sourceLog.progeny1Code && sourceLog.progeny1UserId) {
                    const creature = await db.query.creatures.findFirst({
                        where: and(
                            eq(creatures.userId, sourceLog.progeny1UserId),
                            eq(creatures.code, sourceLog.progeny1Code)
                        ),
                    });
                    if (creature)
                        progenyCreature1 = { userId: creature.userId, code: creature.code };
                }

                // Check if progeny2Code exists before querying and assigning
                if (sourceLog.progeny2Code && sourceLog.progeny2UserId) {
                    const creature = await db.query.creatures.findFirst({
                        where: and(
                            eq(creatures.userId, sourceLog.progeny2UserId),
                            eq(creatures.code, sourceLog.progeny2Code)
                        ),
                    });
                    if (creature)
                        progenyCreature2 = { userId: creature.userId, code: creature.code };
                }
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
                    sourceLog.progeny1Code === progenyCode &&
                    sourceLog.progeny1UserId === progenyUserId
                        ? { progeny1UserId: null, progeny1Code: null }
                        : { progeny2UserId: null, progeny2Code: null };

                await tx
                    .update(breedingLogEntries)
                    .set(updateData)
                    .where(eq(breedingLogEntries.id, sourceLogId));

                const updatedSourceLog = { ...sourceLog, ...updateData };
                const isSourceEmpty =
                    !updatedSourceLog.progeny1Code && !updatedSourceLog.progeny2Code;

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

            if (destinationLog.progeny1Code && destinationLog.progeny2Code) {
                throw new Error('Destination log entry is already full.');
            }

            if (
                (destinationLog.progeny1UserId === progenyUserId &&
                    destinationLog.progeny1Code === progenyCode) ||
                (destinationLog.progeny2UserId === progenyUserId &&
                    destinationLog.progeny2Code === progenyCode)
            ) {
                throw new Error('Progeny already in this log entry.');
            }

            const progenyCreature = await db.query.creatures.findFirst({
                where: and(eq(creatures.code, progenyCode), eq(creatures.userId, progenyUserId)),
                columns: { userId: true, code: true },
            });

            if (!progenyCreature) throw new Error('Progeny creature not found');

            const updateData =
                destinationLog.progeny1Code === null
                    ? { progeny1UserId: progenyCreature.userId, progeny1Code: progenyCreature.code }
                    : {
                          progeny2UserId: progenyCreature.userId,
                          progeny2Code: progenyCreature.code,
                      };

            await tx
                .update(breedingLogEntries)
                .set(updateData)
                .where(eq(breedingLogEntries.id, logEntryId));

            await checkAndRecordAchievements(
                userId,
                destinationLog.pairId,
                [progenyCreature],
                logEntryId
            );

            const parentPair = await tx.query.breedingPairs.findFirst({
                where: and(
                    eq(breedingPairs.id, destinationLog.pairId),
                    eq(breedingPairs.userId, userId)
                ),
                with: { maleParent: true, femaleParent: true },
            });

            const [allUserPairs, allUserLogs] = await Promise.all([
                db.query.breedingPairs.findMany({ where: eq(breedingPairs.userId, userId) }),
                db.query.breedingLogEntries.findMany({
                    where: eq(breedingLogEntries.userId, userId),
                }),
            ]);
            if (parentPair?.maleParent && parentPair?.femaleParent) {
                const newGeneration =
                    Math.max(
                        parentPair.maleParent.generation ?? 1,
                        parentPair.femaleParent.generation ?? 1
                    ) + 1;
                await tx
                    .update(creatures)
                    .set({ generation: newGeneration, origin: 'bred' })
                    .where(
                        and(
                            eq(creatures.userId, progenyCreature.userId),
                            eq(creatures.code, progenyCreature.code)
                        )
                    );
            }

            const generation = await calculateGeneration(
                progenyCreature,
                allUserPairs,
                allUserLogs
            );

            await tx
                .update(creatures)
                .set({ generation: generation || 2, origin: 'bred' })
                .where(
                    and(
                        eq(creatures.userId, progenyCreature.userId),
                        eq(creatures.code, progenyCreature.code)
                    )
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
                    description: `Moved progeny ${progenyCreature1?.code || progenyCreature2?.code} from log entry for pair "${sourcePair?.pairName}" to log entry for pair ${destinationPair?.pairName}`,
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
