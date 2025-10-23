import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { breedingPairs, creatures, researchGoals } from '@/src/db/schema';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hasObscenity } from '@/lib/obscenity';
import { validatePairing } from '@/lib/breeding-rules-client';
import { logUserAction } from '@/lib/user-actions';

const createPairSchema = z.object({
    pairName: z
        .string()
        .min(3, 'Pair name must be at least 3 characters.')
        .max(32, 'Pair name can not be more than 32 characters.'),
    maleParentUserId: z.string(),
    maleParentCode: z.string(),
    femaleParentUserId: z.string(),
    femaleParentCode: z.string(),
    assignedGoalIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validatedFields = createPairSchema.safeParse(body);

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
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
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
                { error: 'One or both selected parents could not be found.' },
                { status: 404 }
            );
        }

        const pairingValidation = validatePairing(maleParent, femaleParent);
        if (!pairingValidation.isValid) {
            return NextResponse.json({ error: pairingValidation.error }, { status: 400 });
        }

        const existingPair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.userId, userId),
                eq(breedingPairs.maleParentUserId, maleParentUserId),
                eq(breedingPairs.maleParentCode, maleParentCode),
                eq(breedingPairs.femaleParentUserId, femaleParentUserId),
                eq(breedingPairs.femaleParentCode, femaleParentCode)
            ),
        });

        if (existingPair) {
            return NextResponse.json(
                { error: 'A breeding pair with these parents already exists.' },
                { status: 409 }
            );
        }

        const [newPair] = await db
            .insert(breedingPairs)
            .values({
                userId,
                pairName,
                species: maleParent.species!,
                maleParentUserId,
                maleParentCode,
                femaleParentUserId,
                femaleParentCode,
                assignedGoalIds: assignedGoalIds || [],
            })
            .returning();

        if (assignedGoalIds && assignedGoalIds.length > 0) {
            const goalsToUpdate = await db.query.researchGoals.findMany({
                where: and(
                    inArray(researchGoals.id, assignedGoalIds),
                    eq(researchGoals.userId, userId)
                ),
            });
            for (const goal of goalsToUpdate) {
                const currentPairIds = new Set(goal.assignedPairIds || []);
                currentPairIds.add(newPair.id);
                await db
                    .update(researchGoals)
                    .set({ assignedPairIds: Array.from(currentPairIds) })
                    .where(eq(researchGoals.id, goal.id));
                revalidatePath(`/research-goals/${goal.id}`);
            }
        }

        await logUserAction({
            action: 'pair.create',
            description: `Created breeding pair "${newPair.pairName}"`,
        });

        revalidatePath('/breeding-pairs');
        revalidatePath('/research-goals');

        return NextResponse.json(
            { message: 'Breeding pair created successfully!', pair: newPair },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Failed to create breeding pair:', error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
