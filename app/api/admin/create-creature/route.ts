import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures } from '@/src/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';

const createCreatureSchema = z.object({
    creatureName: z.string().min(1),
    creatureCode: z.string().min(1),
    species: z.string().min(1),
    genes: z.record(
        z.string(),
        z.object({
            genotype: z.string(),
            phenotype: z.string(),
            isMultiGenotype: z.boolean().optional(),
            isOptional: z.boolean().optional(),
        })
    ),
});

export async function POST(req: Request) {
    const session = await auth();

    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = createCreatureSchema.safeParse(body);

        if (!validated.success) {
            // Using .format() gives a more readable error structure
            const formattedErrors = validated.error.format();
            const validatedError = `Could not create creature: ${JSON.stringify(formattedErrors)}`;
            return NextResponse.json({ error: validatedError }, { status: 400 });
        }

        const { creatureName, creatureCode, species, genes } = validated.data;

        // 1. Construct genetics string and genotypes for URL
        const genotypesForUrl: { [key: string]: string } = {};
        let gender = 'unknown';

        for (const [category, geneInfo] of Object.entries(genes)) {
            genotypesForUrl[category] = geneInfo.genotype;
            if (geneInfo && category === 'Gender' && typeof geneInfo.genotype === 'string') {
                gender = geneInfo.genotype.toLowerCase();
            }
        }

        // 2. Create image
        const tfoImageUrl = constructTfoImageUrl(species, genotypesForUrl);
        const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
        const blobUrl = await fetchAndUploadWithRetry(bustedTfoImageUrl, creatureCode, 3);

        await db
            .insert(creatures)
            .values({
                userId,
                code: creatureCode,
                creatureName,
                species,
                genetics: genes,
                imageUrl: blobUrl,
                gender: gender as 'male' | 'female' | 'unknown',
                growthLevel: 3, // Default to adult
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [creatures.userId, creatures.code],
                set: {
                    creatureName,
                },
            });

        revalidatePath('/collection');
        return NextResponse.json({ message: 'Creature created successfully!' }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating creature:', error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
