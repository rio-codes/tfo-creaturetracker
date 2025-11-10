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
import { logUserAction } from '@/lib/user-actions';

const goalSchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters.')
        .max(32, 'Name must be less than 32 characters.'),
    gender: z.enum(['male', 'female']),
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
    goalMode: z.enum(['genotype', 'phenotype']).optional().default('phenotype'),
    targetGeneration: z.number().optional().default(1).nullable(),
});

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

    for (const [category, selectedGene] of Object.entries(genes)) {
        const selectedGenotype = selectedGene.genotype;
        const categoryData = speciesData[category];
        if (!categoryData) {
            throw new Error(`Invalid gene category "${category}" for species "${species}".`);
        }

        if (typeof categoryData !== 'object' || !Array.isArray(categoryData)) {
            throw new Error(`Invalid gene data for category "${category}". Expected an array.`);
        }

        const isValidGenotype = categoryData.some((gene) => gene.genotype === selectedGenotype);
        if (!isValidGenotype) {
            throw new Error(`Invalid genotype "${selectedGenotype}" for category "${category}".`);
        }
    }
}

export async function POST(req: Request) {
    console.log('Received', req.body);
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedFields = goalSchema.safeParse(body);
        if (!validatedFields.success) {
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
        const { name, species, genes, goalMode, targetGeneration } = validatedFields.data;
        if (hasObscenity(name)) {
            console.log('Inappropriate name provided for changed research goal');
            return NextResponse.json(
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
        }
        validateGoalData(species, genes);

        const speciesCode = TFO_SPECIES_CODES[species];
        if (!speciesCode) throw new Error(`Invalid species provided: ${species}`);

        const genotypesForUrl = Object.fromEntries(
            Object.entries(genes).map(([category, selection]) => {
                const geneSelection = selection as { genotype: string };
                return [category, geneSelection.genotype];
            })
        );

        const tfoImageUrl = constructTfoImageUrl(species, genotypesForUrl, 'female');
        const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
        const blobUrl = await fetchAndUploadWithRetry(bustedTfoImageUrl, null, 3);

        const [newGoal] = await db
            .insert(researchGoals)
            .values({
                userId: session.user.id,
                name: name,
                species: species,
                gender: 'female',
                imageUrl: blobUrl,
                genes: genes,
                goalMode: goalMode,
                targetGeneration: targetGeneration,
                updatedAt: new Date(),
            })
            .returning();

        await logUserAction({
            action: 'goal.create',
            description: `Created research goal "${newGoal.name}"`,
        });

        revalidatePath('/research-goals');

        return NextResponse.json(
            { message: 'Research Goal created successfully!', goalId: newGoal.id },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Failed to create research goal:', error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
