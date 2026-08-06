import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { breedingPairs, creatures, researchGoals } from '@/src/db/schema';
import { z } from 'zod';
import { and, eq, inArray, or } from 'drizzle-orm';
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
        console.warn('[BREEDING_PAIRS][POST] Unauthenticated attempt to create pair.');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        console.log(`[BREEDING_PAIRS][POST] Received request for userId=${userId}:`, JSON.stringify(body));

        const validatedFields = createPairSchema.safeParse(body);

        if (!validatedFields.success) {
            const { fieldErrors } = validatedFields.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error(`[BREEDING_PAIRS][POST] Validation failed for userId=${userId}:`, fieldErrors);
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
            console.warn(`[BREEDING_PAIRS][POST] Obscenity detected in pairName="${pairName}" for userId=${userId}`);
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
            console.warn(`[BREEDING_PAIRS][POST] Parent missing. Male found: ${!!maleParent}, Female found: ${!!femaleParent}`);
            return NextResponse.json(
                { error: 'One or both selected parents could not be found.' },
                { status: 404 }
            );
        }

        const pairingValidation = validatePairing(maleParent, femaleParent);
        if (!pairingValidation.isValid) {
            console.warn(`[BREEDING_PAIRS][POST] Invalid pairing for userId=${userId}: ${pairingValidation.error}`);
            return NextResponse.json({ error: pairingValidation.error }, { status: 400 });
        }

        const existingPairName = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.userId, userId),
                eq(breedingPairs.pairName, pairName)
            ),
        });

        if (existingPairName) {
            console.warn(`[BREEDING_PAIRS][POST] Duplicate pair name "${pairName}" for userId=${userId}`);
            return NextResponse.json(
                { error: 'A breeding pair with this name already exists.' },
                { status: 409 }
            );
        }

        const existingPair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.userId, userId),
                or(
                    and(
                        eq(breedingPairs.maleParentUserId, maleParentUserId),
                        eq(breedingPairs.maleParentCode, maleParentCode),
                        eq(breedingPairs.femaleParentUserId, femaleParentUserId),
                        eq(breedingPairs.femaleParentCode, femaleParentCode)
                    ),
                    and(
                        eq(breedingPairs.maleParentUserId, femaleParentUserId),
                        eq(breedingPairs.maleParentCode, femaleParentCode),
                        eq(breedingPairs.femaleParentUserId, maleParentUserId),
                        eq(breedingPairs.femaleParentCode, maleParentCode)
                    )
                )
            ),
        });

        if (existingPair) {
            console.warn(`[BREEDING_PAIRS][POST] Duplicate parent pair found (pairId=${existingPair.id}) for userId=${userId}`);
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

        console.log(`[BREEDING_PAIRS][POST] Created new breeding pair: id=${newPair.id}, name="${newPair.pairName}", userId=${userId}`);

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
        console.error('[BREEDING_PAIRS][POST] Error creating breeding pair:', error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
