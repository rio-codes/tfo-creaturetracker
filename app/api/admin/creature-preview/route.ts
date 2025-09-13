import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';
import * as Sentry from '@sentry/nextjs';

const previewCreatureSchema = z.object({
    species: z.string().min(1),
    genes: z.record(
        z.string(),
        z.object({
            genotype: z.string(),
            phenotype: z.string(),
            isMultiGenotype: z.boolean(),
        })
    ),
});

export async function POST(req: Request) {
    Sentry.captureMessage('Admin: creature preview', 'log');
    const session = await auth();

    if (session?.user?.role !== 'admin') {
        Sentry.captureMessage('Forbidden access to admin creature preview', 'warning');
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const validated = previewCreatureSchema.safeParse(body);

        if (!validated.success) {
            Sentry.captureMessage('Invalid input for admin creature preview', 'warning');
            return NextResponse.json(
                { error: 'Invalid input.', details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const { species, genes } = validated.data;

        const genotypesForUrl: { [key: string]: string } = {};
        for (const [category, geneInfo] of Object.entries(genes)) {
            genotypesForUrl[category] = geneInfo.genotype;
        }

        const tfoImageUrl = constructTfoImageUrl(species, genotypesForUrl);
        const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;

        const referenceId = `admin-preview-${crypto.randomUUID()}`;
        const blobUrl = await fetchAndUploadWithRetry(bustedTfoImageUrl, referenceId, 3);

        Sentry.captureMessage('Admin: creature preview generated successfully', 'info');
        return NextResponse.json({ imageUrl: blobUrl });
    } catch (error: any) {
        Sentry.captureException(error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
