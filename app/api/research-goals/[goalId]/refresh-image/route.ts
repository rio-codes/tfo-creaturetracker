import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Refreshing image for goal ${params.goalId}`, 'log');
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to refresh goal image', 'warning');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const goal = await db.query.researchGoals.findFirst({
            where: and(
                eq(researchGoals.id, params.goalId),
                eq(researchGoals.userId, session.user.id)
            ),
        });

        if (!goal) {
            Sentry.captureMessage(`Goal not found for image refresh: ${params.goalId}`, 'warning');
            return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
        }

        if (!goal.genes || typeof goal.genes !== 'object') {
            Sentry.captureMessage(
                `Goal has no gene data for image refresh: ${params.goalId}`,
                'warning'
            );
            return NextResponse.json(
                { error: 'Goal has no gene data to generate an image.' },
                { status: 400 }
            );
        }

        const genotypesForUrl = Object.fromEntries(
            Object.entries(goal.genes).map(([category, selection]) => [
                category,
                (selection as { genotype: string }).genotype,
            ])
        );

        const tfoImageUrl = constructTfoImageUrl(goal.species, genotypesForUrl);
        const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
        const blobUrl = await fetchAndUploadWithRetry(bustedTfoImageUrl, `goal-${goal.id}`, 3);

        await db
            .update(researchGoals)
            .set({ imageUrl: blobUrl, updatedAt: new Date() })
            .where(eq(researchGoals.id, goal.id));

        revalidatePath(`/research-goals/${goal.id}`);
        revalidatePath('/research-goals');

        Sentry.captureMessage(`Successfully refreshed image for goal ${goal.id}`, 'info');
        return NextResponse.json({ imageUrl: blobUrl });
    } catch (error: any) {
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
