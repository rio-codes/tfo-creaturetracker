import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals, users } from '@/src/db/schema';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { calculateGeneProbability, calculateBreedingOutcomes } from '@/lib/genetics';
import { enrichAndSerializeCreatureWithProgeny, enrichAndSerializeGoal } from '@/lib/serialization';
import { GoalGene } from '@/types';

const predictionSchema = z.object({
    maleParentUserId: z.string(),
    maleParentCode: z.string(),
    femaleParentUserId: z.string(),
    femaleParentCode: z.string(),
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
        const { maleParentUserId, maleParentCode, femaleParentUserId, femaleParentCode, goalIds } =
            validated.data;

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
            enrichAndSerializeCreatureWithProgeny(maleParentCode, maleParentUserId, 0),
            enrichAndSerializeCreatureWithProgeny(femaleParentCode, femaleParentUserId, 0),
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
            return enrichAndSerializeGoal(goal, goal.goalMode);
        });

        const predictions = enrichedGoals.map((goal) => {
            let totalChance = 0;
            let geneCount = 0;
            let isPossible = true;
            for (const [category, targetGeneInfo] of Object.entries(goal.genes)) {
                const targetGene = targetGeneInfo as any;
                const chance = calculateGeneProbability(
                    calculateBreedingOutcomes(maleParent, femaleParent),
                    goal.species,
                    category,
                    targetGene.gene as GoalGene,
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
