import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { constructTfoImageUrl } from '@/lib/tfo-utils';

import * as Sentry from '@sentry/nextjs';
const previewSchema = z.object({
    species: z.string().min(1),
    genes: z.record(
        z.string(),
        z.object({
            genotype: z.string(),
            phenotype: z.string(),
        })
    ),
});
export async function POST(req: Request) {
    Sentry.captureMessage('Generating goal preview image', 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage(
            'Unauthenticated attempt to generate goal preview image',
            'warning'
        );
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        console.log('Received ', body);
        const validatedFields = previewSchema.safeParse(body);

        if (!validatedFields.success) {
            const fieldErrors = validatedFields.error.flatten().fieldErrors;
            const allErrorArrays = Object.values(fieldErrors);
            const allErrors = allErrorArrays.flat();
            const errorString = allErrors.join('\n');
            console.error('Zod Validation Failed:', errorString);
            Sentry.captureMessage(
                `Zod validation failed for goal preview image: ${errorString}`,
                'warning'
            );
            return NextResponse.json(
                { error: 'Invalid data provided.' },
                { status: 400 }
            );
        }
        const { species, genes } = validatedFields.data;

        // get genotype to construct image url
        const genotypesForUrl = Object.fromEntries(
            Object.entries(genes).map(([category, selection]) => {
                const geneSelection = selection as { genotype: string };
                return [category, geneSelection.genotype];
            })
        );

        const imageUrl = constructTfoImageUrl(species, genotypesForUrl);

        Sentry.captureMessage(
            'Successfully generated goal preview image URL',
            'info'
        );
        return NextResponse.json({ imageUrl });
    } catch (error: any) {
        console.error('Failed to generate preview URL:', error);
        Sentry.captureException(error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
