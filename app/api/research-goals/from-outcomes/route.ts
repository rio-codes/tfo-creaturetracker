import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals, breedingPairs, goalModeEnum } from '@/src/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';
import { structuredGeneData } from '@/constants/creature-data';
import { and, eq } from 'drizzle-orm';
import { logUserAction } from '@/lib/user-actions';

interface GeneInfo {
    genotype: string;
    phenotype: string;
}

type GeneCategory = GeneInfo[];

interface SpeciesGeneData {
    [category: string]: GeneCategory;
}

interface GoalGene {
    genotype: string;
    phenotype: string;
    isMultiGenotype: boolean;
    isOptional: boolean;
}

const createGoalSchema = z.object({
    pairId: z.string().uuid(),
    goalName: z.string().min(3, 'Goal name must be at least 3 characters.'),
    species: z.string(),
    selectedGenotypes: z.record(z.string(), z.string()),
    goalMode: z.enum(goalModeEnum.enumValues),
    optionalGenes: z.record(z.string(), z.boolean()),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = createGoalSchema.safeParse(body);
        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed in from-outcomes', { fieldErrors });
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }
        const { pairId, goalName, species, selectedGenotypes, goalMode, optionalGenes } =
            validated.data;

        const speciesGeneData = (structuredGeneData as Record<string, SpeciesGeneData>)[species];
        if (!speciesGeneData) {
            return NextResponse.json({ error: `Invalid species: ${species}` }, { status: 400 });
        }
        const goalGenes: { [key: string]: GoalGene } = {};
        for (const [category, genotype] of Object.entries(selectedGenotypes)) {
            const categoryData = speciesGeneData[category];
            if (!categoryData) {
                return NextResponse.json(
                    { error: `Invalid gene category: ${category}` },
                    { status: 400 }
                );
            }
            const geneInfo = categoryData.find((g) => g.genotype === genotype);

            if (!geneInfo) {
                return NextResponse.json(
                    { error: `Invalid genotype ${genotype} for ${category}` },
                    { status: 400 }
                );
            }

            const genotypesForPhenotype = categoryData.filter(
                (g) => g.phenotype === geneInfo.phenotype
            );

            goalGenes[category] = {
                genotype: genotype,
                phenotype: geneInfo.phenotype,
                isMultiGenotype: genotypesForPhenotype.length > 1,
                isOptional: optionalGenes[category] || false,
            };
        }

        const tfoImageUrl = constructTfoImageUrl(species, selectedGenotypes);
        const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
        const blobUrl = await fetchAndUploadWithRetry(bustedTfoImageUrl, null, 3);

        const newGoalResult = await db
            .insert(researchGoals)
            .values({
                userId: userId,
                name: goalName,
                species: species,
                imageUrl: blobUrl,
                genes: goalGenes,
                goalMode: goalMode,
                assignedPairIds: [pairId],
                updatedAt: new Date(),
            })
            .returning({ id: researchGoals.id });

        const newGoalId = newGoalResult[0].id;

        const pair = await db.query.breedingPairs.findFirst({
            where: and(eq(breedingPairs.id, pairId), eq(breedingPairs.userId, userId)),
        });
        if (pair) {
            const existingGoalIds = new Set(pair.assignedGoalIds || []);
            existingGoalIds.add(newGoalId);
            await db
                .update(breedingPairs)
                .set({ assignedGoalIds: Array.from(existingGoalIds) })
                .where(eq(breedingPairs.id, pairId));
        }

        revalidatePath('/research-goals');
        revalidatePath('/breeding-pairs');
        revalidatePath(`/research-goals/${newGoalId}`);

        await logUserAction({
            action: 'goal.create',
            description: `Created research goal "${goalName}"`,
        });

        return NextResponse.json(
            {
                message: 'Goal created and assigned successfully!',
                goalId: newGoalId,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
