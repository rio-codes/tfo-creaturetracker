import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { breedingPairs } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import * as Sentry from '@sentry/nextjs';

const previewSchema = z.object({
    selectedGenotypes: z.record(z.string(), z.string()),
});

export async function POST(req: Request, props: { params: Promise<{ pairId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Generating outcomes preview for pair ${params.pairId}`, 'log');
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to generate outcomes preview', 'log');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = previewSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            Sentry.captureMessage(
                `Invalid genetic data for previewing outcome. ${errorMessage}`,
                'log'
            );
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { selectedGenotypes } = validated.data;

        const pair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.id, params.pairId),
                eq(breedingPairs.userId, session.user.id)
            ),
        });

        if (!pair) {
            Sentry.captureMessage(
                `Breeding pair not found for outcomes preview: ${params.pairId}`,
                'log'
            );
            return NextResponse.json({ error: 'Breeding pair not found.' }, { status: 404 });
        }

        const tfoImageUrl = constructTfoImageUrl(pair.species, selectedGenotypes);
        const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
        const blobUrl = await fetchAndUploadWithRetry(
            bustedTfoImageUrl,
            `pair-preview-${pair.id}`,
            3
        );

        await db
            .update(breedingPairs)
            .set({ outcomesPreviewUrl: blobUrl })
            .where(eq(breedingPairs.id, pair.id));

        revalidatePath('/breeding-pairs');

        Sentry.captureMessage(
            `Successfully generated outcomes preview for pair ${params.pairId}`,
            'info'
        );
        return NextResponse.json({ imageUrl: blobUrl });
    } catch (error: any) {
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
