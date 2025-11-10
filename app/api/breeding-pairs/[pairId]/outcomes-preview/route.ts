import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { breedingPairs } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const previewSchema = z.object({
    selectedGenotypes: z.record(z.string(), z.string()),
    gender: z.enum(['male', 'female']),
});

export async function POST(req: Request, props: { params: Promise<{ pairId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
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
            console.error('Zod Validation Failed in outcomes-preview', { fieldErrors });
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { selectedGenotypes, gender } = validated.data;

        const pair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.id, params.pairId),
                eq(breedingPairs.userId, session.user.id)
            ),
        });

        if (!pair) {
            return NextResponse.json({ error: 'Breeding pair not found.' }, { status: 404 });
        }

        const tfoImageUrl = constructTfoImageUrl(pair.species, selectedGenotypes, gender);
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

        return NextResponse.json({ imageUrl: blobUrl });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
