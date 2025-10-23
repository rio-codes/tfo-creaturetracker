import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs, breedingLogEntries } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';
import { updateDescendantGenerations } from '@/lib/creature-utils';

const updateGenerationSchema = z.object({
    generation: z.number().int().positive().default(1),
    origin: z
        .enum(['unknown', 'cupboard', 'genome-splicer', 'another-lab', 'quest', 'raffle'])
        .nullable(),
});

export async function PATCH(request: Request, props: { params: Promise<{ creatureId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;
    try {
        const body = await request.json();
        const validated = updateGenerationSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { generation, origin } = validated.data;

        await db.transaction(async (tx) => {
            const [updatedCreature] = await tx
                .update(creatures)
                .set({ generation, origin })
                .where(and(eq(creatures.id, params.creatureId), eq(creatures.userId, userId)))
                .returning();

            if (!updatedCreature) {
                throw new Error('Creature not found or you do not have permission to edit it.');
            }

            // Start the recursive update for all descendants
            await updateDescendantGenerations(params.creatureId, userId);

            // After updating all descendants, we need to recalculate their generations
            const [allUserPairs, allUserLogs] = await Promise.all([
                tx.query.breedingPairs.findMany({
                    where: eq(breedingPairs.userId, userId),
                    with: { maleParent: true, femaleParent: true },
                }),
                tx.query.breedingLogEntries.findMany({
                    where: eq(breedingLogEntries.userId, userId),
                }),
            ]);

            const allCreatures = await tx.query.creatures.findMany({
                where: eq(creatures.userId, userId),
            });

            for (const creature of allCreatures) {
                if (creature.origin === 'bred') {
                    const log = allUserLogs.find(
                        (l) =>
                            (l.progeny1UserId === creature.userId &&
                                l.progeny1Code === creature.code) ||
                            (l.progeny2UserId === creature.userId &&
                                l.progeny2Code === creature.code)
                    );
                    if (log) {
                        const pair = allUserPairs.find((p) => p.id === log.pairId);
                        if (pair && pair.maleParent && pair.femaleParent) {
                            const newGen =
                                Math.max(
                                    pair.maleParent.generation ?? 1,
                                    pair.femaleParent.generation ?? 1
                                ) + 1;
                            if (creature.generation !== newGen) {
                                await tx
                                    .update(creatures)
                                    .set({ generation: newGen })
                                    .where(eq(creatures.id, creature.id));
                            }
                        }
                    }
                }
            }

            await logUserAction({
                action: 'creature.update.generation',
                description: `Updated ${updatedCreature.creatureName}'s generation to ${generation}.`,
            });
        });

        revalidatePath('/collection', 'layout');

        return NextResponse.json({ message: 'Generation updated successfully.' });
    } catch (error: any) {
        console.error('Failed to update generation:', error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
