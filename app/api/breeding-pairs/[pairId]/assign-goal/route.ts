import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { breedingPairs, researchGoals } from '@/src/db/schema';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as Sentry from '@sentry/nextjs';

const assignGoalSchema = z.object({
    goalId: z.string().uuid('A valid goal ID is required.'),
    assign: z.boolean(), // true to assign, false to unassign
});

export async function PATCH(req: Request, props: { params: Promise<{ pairId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Assigning goal to pair ${params.pairId}`, 'log');
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to assign goal', 'log');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = assignGoalSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            Sentry.captureMessage(`Invalid data for assigning goal. ${errorMessage}`, 'log');
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { goalId, assign } = validated.data;
        const { pairId } = params;

        // 1. Fetch the pair and the goal to ensure they both belong to the user
        const [pair, goal] = await Promise.all([
            db.query.breedingPairs.findFirst({
                where: and(eq(breedingPairs.id, pairId), eq(breedingPairs.userId, userId)),
            }),
            db.query.researchGoals.findFirst({
                where: and(eq(researchGoals.id, goalId), eq(researchGoals.userId, userId)),
            }),
        ]);

        if (!pair || !goal) {
            Sentry.captureMessage(
                `Pair or Goal not found for assignment. Pair: ${pairId}, Goal: ${goalId}`,
                'log'
            );
            return NextResponse.json({ error: 'Pair or Goal not found.' }, { status: 404 });
        }
        if (pair.species !== goal.species) {
            Sentry.captureMessage(
                `Species mismatch on goal assignment. Pair: ${pairId}, Goal: ${goalId}`,
                'log'
            );
            return NextResponse.json(
                { error: 'Goal species must match pair species.' },
                { status: 400 }
            );
        }

        // 2. Update the `assignedGoalIds` array on the PAIR
        const currentGoalIds = new Set(pair.assignedGoalIds || []);
        if (assign) {
            console.log('adding goal');
            currentGoalIds.add(goalId); // Add the goal
        } else {
            console.log('deleting goal');
            currentGoalIds.delete(goalId); // Remove the goal
        }
        const updatedGoalIds = Array.from(currentGoalIds);

        await db
            .update(breedingPairs)
            .set({ assignedGoalIds: updatedGoalIds })
            .where(eq(breedingPairs.id, pairId));

        // ALSO UPDATE the `assignedPairIds` array on the GOAL
        const currentPairIds = new Set(goal.assignedPairIds || []);
        if (assign) {
            currentPairIds.add(pairId);
        } else {
            currentPairIds.delete(pairId);
        }
        const updatedPairIds = Array.from(currentPairIds);

        await db
            .update(researchGoals)
            .set({ assignedPairIds: updatedPairIds })
            .where(eq(researchGoals.id, goalId));

        revalidatePath(`/research-goals/${goalId}`);
        revalidatePath('/breeding-pairs');

        Sentry.captureMessage(
            `Goal ${goalId} ${assign ? 'assigned to' : 'unassigned from'} pair ${pairId}`,
            'info'
        );
        return NextResponse.json({
            message: `Goal ${assign ? 'assigned' : 'unassigned'} successfully.`,
        });
    } catch (error) {
        console.error('Failed to assign goal:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
