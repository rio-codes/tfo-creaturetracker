import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals, users } from '@/src/db/schema';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { calculateGeneProbability } from '@/lib/genetics';
import { structuredGeneData } from '@/constants/creature-data';
import { enrichAndSerializeCreatureWithProgeny } from '@/lib/serialization';

const predictionSchema = z.object({
    maleParentId: z.string().uuid(),
    femaleParentId: z.string().uuid(),
    goalIds: z.array(z.string().uuid()).optional(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = predictionSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json({ error: validated.error.issues }, { status: 400 });
        }
        const { maleParentId, femaleParentId, goalIds } = validated.data;

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        const goals =
            goalIds && goalIds.length > 0
                ? await db.query.researchGoals.findMany({
                      where: and(
                          inArray(researchGoals.id, goalIds),
                          eq(researchGoals.userId, userId)
                      ),
                  })
                : [];

        if (!user) {
            return NextResponse.json({ error: 'Could not find user.' }, { status: 404 });
        }

        const [maleParent, femaleParent] = await Promise.all([
            enrichAndSerializeCreatureWithProgeny(maleParentId, 0),
            enrichAndSerializeCreatureWithProgeny(femaleParentId, 0),
        ]);

        if (!maleParent || !femaleParent) {
            return NextResponse.json(
                {
                    error: 'Could not process parent creatures. They may be missing species information.',
                },
                { status: 404 }
            );
        }

        const enrichedGoals = goals.map((goal) => {
            const enrichedGenes: { [key: string]: any } = {};
            const speciesGeneData = structuredGeneData[goal.species];
            if (!speciesGeneData || !goal.genes) return { ...goal, genes: {} };

            for (const [category, selection] of Object.entries(goal.genes)) {
                let finalGenotype: string,
                    finalPhenotype: string,
                    isMulti = false;
                if (typeof selection === 'object' && selection?.phenotype && selection?.genotype) {
                    finalGenotype = selection.genotype;
                    finalPhenotype = selection.phenotype;
                } else if (typeof selection === 'string') {
                    finalGenotype = selection;
                    const categoryData = speciesGeneData[category];
                    const matchedGene = categoryData?.find((g) => g.genotype === finalGenotype);
                    finalPhenotype = matchedGene?.phenotype || 'Unknown';
                } else continue;

                if (goal.goalMode === 'phenotype') {
                    const categoryData = speciesGeneData[category];
                    const genotypesForPhenotype = categoryData?.filter(
                        (g) => g.phenotype === finalPhenotype
                    );
                    isMulti = (genotypesForPhenotype?.length || 0) > 1;
                }

                enrichedGenes[category] = {
                    genotype: finalGenotype,
                    phenotype: finalPhenotype,
                    isMultiGenotype: isMulti,
                    isOptional: (selection as any).isOptional ?? false,
                };
            }
            return { ...goal, genes: enrichedGenes };
        });

        const predictions = enrichedGoals.map((goal) => {
            let totalChance = 0;
            let geneCount = 0;
            let isPossible = true;
            for (const [category, targetGeneInfo] of Object.entries(goal.genes)) {
                const targetGene = targetGeneInfo as any;
                const chance = calculateGeneProbability(
                    maleParent,
                    femaleParent,
                    category,
                    targetGene,
                    goal.goalMode
                );
                if (!targetGene.isOptional) {
                    if (chance === 0) {
                        isPossible = false;
                    }
                    totalChance += chance;
                    geneCount++;
                }
            }
            const averageChance = geneCount > 0 ? totalChance / geneCount : 1;
            return {
                goalId: goal.id,
                goalName: goal.name,
                averageChance,
                isPossible,
            };
        });

        return NextResponse.json({ predictions });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
