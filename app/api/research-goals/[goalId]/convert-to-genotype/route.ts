import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { enrichAndSerializeGoal } from '@/lib/serialization';
import * as Sentry from '@sentry/nextjs';

const conversionSchema = z.object({
    conversions: z.record(z.string(), z.string()),
});

export async function PATCH(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Converting goal ${params.goalId} to genotype`, 'log');
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to convert goal', 'log');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const { goalId } = params;
        const body = await req.json();
        const validated = conversionSchema.safeParse(body);
        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            Sentry.captureMessage(`Invalid data for creating pair. ${errorMessage}`, 'log');
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }
        const { conversions } = validated.data;

        const goal = await db.query.researchGoals.findFirst({
            where: and(eq(researchGoals.id, goalId), eq(researchGoals.userId, userId)),
        });

        if (!goal) {
            Sentry.captureMessage(`Goal not found for conversion: ${goalId}`, 'log');
            return NextResponse.json(
                {
                    error: 'Goal not found or you do not have permission to edit it.',
                },
                { status: 404 }
            );
        }

        const enrichedGoal = enrichAndSerializeGoal(goal, goal.goalMode);
        const updatedGenes = { ...enrichedGoal?.genes };
        for (const [category, newGenotype] of Object.entries(conversions)) {
            if (updatedGenes[category]) {
                updatedGenes[category].genotype = newGenotype as string;
            }
        }

        await db
            .update(researchGoals)
            .set({
                genes: updatedGenes,
                goalMode: 'genotype',
            })
            .where(eq(researchGoals.id, goalId));

        revalidatePath(`/research-goals/${goalId}`);

        Sentry.captureMessage(`Goal ${goalId} converted to genotype mode`, 'info');
        return NextResponse.json({
            message: 'Goal successfully converted to genotype mode.',
        });
    } catch (error: any) {
        console.error('Failed to convert goal:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
