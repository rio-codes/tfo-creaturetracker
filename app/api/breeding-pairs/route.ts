import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { breedingPairs, creatures, researchGoals } from '@/src/db/schema';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validatePairing } from '@/lib/breeding-rules';
import {
    RegExpMatcher,
    englishDataset,
    englishRecommendedTransformers,
} from 'obscenity';

const createPairSchema = z.object({
    pairName: z
        .string()
        .min(3, 'Pair name must be at least 3 characters.')
        .max(32, 'Pair name can not be more than 32 characters.'),
    species: z.string().min(1, 'Species is required.'),
    maleParentId: z.string().uuid('Invalid male parent ID.'),
    femaleParentId: z.string().uuid('Invalid female parent ID.'),
    assignedGoalIds: z.array(z.string().uuid()).optional(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validatedFields = createPairSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                {
                    error: 'Invalid data provided.',
                    details: validatedFields.error.flatten(),
                },
                { status: 400 }
            );
        }

        const { pairName, maleParentId, femaleParentId, assignedGoalIds } =
            validatedFields.data;

        const matcher = new RegExpMatcher({
            ...englishDataset.build(),
            ...englishRecommendedTransformers,
        });

        if (matcher.hasMatch(pairName)) {
            return NextResponse.json(
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
        }

        const [maleParent, femaleParent] = await Promise.all([
            db.query.creatures.findFirst({
                where: and(
                    eq(creatures.id, maleParentId),
                    eq(creatures.userId, userId)
                ),
            }),
            db.query.creatures.findFirst({
                where: and(
                    eq(creatures.id, femaleParentId),
                    eq(creatures.userId, userId)
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
            return NextResponse.json(
                { error: pairingValidation.error },
                { status: 400 }
            );
        }

        const [newPair] = await db
            .insert(breedingPairs)
            .values({
                userId,
                pairName,
                species: maleParent.species!,
                maleParentId,
                femaleParentId,
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
