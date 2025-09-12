import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { hasObscenity } from '@/lib/obscenity';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { TFO_SPECIES_CODES } from '@/constants/creature-data';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { structuredGeneData } from '@/constants/creature-data';
import { fetchAndUploadWithRetry } from '@/lib/data';
import * as Sentry from '@sentry/nextjs';

const goalSchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters.')
        .max(32, 'Name must be less than 32 characters.'),
    species: z.string().min(1, 'Species is required.'),
    genes: z.record(
        z.string(),
        z.object({
            genotype: z.string(),
            phenotype: z.string(),
            isMultiGenotype: z.boolean(),
            isOptional: z.boolean(),
        })
    ),
    goalMode: z.enum(['genotype', 'phenotype']),
});

// function to make sure species, categories, and genotypes are valid
export function validateGoalData(
    species: string,
    genes: {
        [key: string]: {
            genotype: string;
            phenotype: string;
            isMultiGenotype: boolean;
            isOptional: boolean;
        };
    }
) {
    const speciesData = structuredGeneData[species];
    if (!speciesData) {
        throw new Error(`Invalid species provided: ${species}`);
    }

    // ensure each category is valid for species
    for (const [category, selectedGene] of Object.entries(genes)) {
        const selectedGenotype = selectedGene.genotype;
        const categoryData = speciesData[category];
        if (!categoryData) {
            throw new Error(`Invalid gene category "${category}" for species "${species}".`);
        }
        // ensure genotype exists for category
        const isValidGenotype = categoryData.some((gene) => gene.genotype === selectedGenotype);
        // error if genotype is not valid
        if (!isValidGenotype) {
            throw new Error(`Invalid genotype "${selectedGenotype}" for category "${category}".`);
        }
    }
}

// add new research goal
export async function POST(req: Request) {
    Sentry.captureMessage('Creating new research goal', 'log');
    console.log('Received', req.body);
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to create research goal', 'warning');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        // validate received data with zod schema
        const validatedFields = goalSchema.safeParse(body);
        if (!validatedFields.success) {
            Sentry.logger.warn('Zod validation failed for new goal');
            const { fieldErrors } = validatedFields.error.flatten();
            const errorMessage = Object.values(fieldErrors).flat().join(' ');
            console.log(validatedFields.error.flatten());
            return NextResponse.json(
                {
                    error: errorMessage || 'Invalid data provided.',
                },
                { status: 400 }
            );
        }
        const { name, species, genes } = validatedFields.data;

        if (hasObscenity(name)) {
            Sentry.captureMessage('Obscene language in new goal name', 'warning');
            return NextResponse.json(
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
        }

        // validate received data with custom function
        validateGoalData(species, genes);

        // ensure species is valid
        const speciesCode = TFO_SPECIES_CODES[species];
        if (!speciesCode) throw new Error(`Invalid species provided: ${species}`);

        // get genotype to construct image url
        const genotypesForUrl = Object.fromEntries(
            Object.entries(genes).map(([category, selection]) => {
                const geneSelection = selection as { genotype: string };
                return [category, geneSelection.genotype];
            })
        );

        // fetch new image from tfo and store it in vercel blob
        const tfoImageUrl = constructTfoImageUrl(species, genotypesForUrl);
        const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
        const blobUrl = await fetchAndUploadWithRetry(bustedTfoImageUrl, null, 3);

        // insert new research goal into db
        await db.insert(researchGoals).values({
            userId: session.user.id,
            name: name,
            species: species,
            imageUrl: blobUrl,
            genes: genes,
            updatedAt: new Date(),
        });

        revalidatePath('/research-goals');

        Sentry.captureMessage(`Research goal "${name}" created successfully`, 'info');
        return NextResponse.json(
            { message: 'Research Goal created successfully!' },
            { status: 201 }
        );
    } catch (error: any) {
        Sentry.captureException(error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
