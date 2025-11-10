import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';

const previewCreatureSchema = z.object({
    species: z.string().min(1),
    gender: z.enum(['male', 'female', 'unknown']),
    genes: z.record(
        z.string(),
        z.any() // We only need the genotype, so we can be less strict.
    ),
});

export async function POST(req: Request) {
    const session = await auth();

    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const validated = previewCreatureSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: 'Invalid input.', details: validated.error.format() },
                { status: 400 }
            );
        }

        const { species, gender, genes } = validated.data;

        const genotypesForUrl: { [key: string]: string } = {};
        for (const [category, geneInfo] of Object.entries(genes)) {
            if (geneInfo && typeof geneInfo.genotype === 'string') {
                genotypesForUrl[category] = geneInfo.genotype;
            }
        }

        const tfoImageUrl = constructTfoImageUrl(species, genotypesForUrl, gender);
        const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;

        const referenceId = `admin-preview-${crypto.randomUUID()}`;
        const blobUrl = await fetchAndUploadWithRetry(bustedTfoImageUrl, referenceId, 3);

        return NextResponse.json({ imageUrl: blobUrl });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
