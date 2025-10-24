import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { enrichAndSerializeCreature } from '@/lib/client-serialization';
import { checkForInbreeding } from '@/lib/breeding-rules';
import { calculateGeneProbability } from '@/lib/genetics';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules-client';
import { z } from 'zod';

// We'll use a simplified schema for the incoming goal data
const goalSchema = z.object({
    species: z.string(),
    goalMode: z.enum(['phenotype', 'genotype']),
    genes: z.record(
        z.string(),
        z.object({
            phenotype: z.string(),
            genotype: z.string(),
            isMultiGenotype: z.boolean(),
            isOptional: z.boolean(),
        })
    ),
});

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const goalData = await request.json();
        const validatedGoal = goalSchema.safeParse(goalData);

        if (!validatedGoal.success) {
            return NextResponse.json({ error: 'Invalid goal data provided.' }, { status: 400 });
        }
        const goal = validatedGoal.data;

        const [allUserCreatures, allUserPairs] = await Promise.all([
            db.query.creatures.findMany({
                where: and(eq(creatures.userId, userId), eq(creatures.isArchived, false)),
            }),
            db.query.breedingPairs.findMany({ where: eq(breedingPairs.userId, userId) }),
        ]);

        const existingPairsMap = new Map<string, { name: string; id: string }>();
        for (const pair of allUserPairs) {
            existingPairsMap.set(`|`, { name: pair.pairName, id: pair.id });
        }

        const enrichedCreatures = allUserCreatures.map(enrichAndSerializeCreature);
        const males = enrichedCreatures.filter((c) => c?.gender === 'male' && c?.growthLevel === 3);
        const females = enrichedCreatures.filter(
            (c) => c?.gender === 'female' && c?.growthLevel === 3
        );

        const combinations: any[] = [];
        for (const male of males) {
            for (const female of females) {
                if (!male?.species || !female?.species) continue;

                const possibleOffspring = getPossibleOffspringSpecies(male.species, female.species);
                if (!possibleOffspring.includes(goal.species)) {
                    continue;
                }

                let totalChance = 0;
                let geneCount = 0;
                let isPossible = true;

                for (const [category, targetGeneInfo] of Object.entries(goal.genes)) {
                    const chance = calculateGeneProbability(
                        male,
                        female,
                        category,
                        targetGeneInfo,
                        goal.goalMode
                    );
                    if (!targetGeneInfo.isOptional && chance === 0) {
                        isPossible = false;
                        break;
                    }
                    if (!targetGeneInfo.isOptional) {
                        totalChance += chance;
                        geneCount++;
                    }
                }

                if (isPossible) {
                    const isInbred = await checkForInbreeding(
                        { userId: male.userId, code: male.code },
                        { userId: female.userId, code: female.code }
                    );
                    const averageChance = geneCount > 0 ? totalChance / geneCount : 1;
                    const pairKey = `${male.userId}-${male.code}|${female.userId}-${female.code}`;
                    const existingPair = existingPairsMap.get(pairKey);

                    combinations.push({
                        maleParent: male,
                        femaleParent: female,
                        averageChance: averageChance * 100,
                        isPossible: true,
                        isInbred: isInbred,
                        existingPairName: existingPair?.name,
                        existingPairId: existingPair?.id,
                    });
                }
            }
        }

        const sortedPredictions = combinations.sort((a, b) => b.averageChance - a.averageChance);

        return NextResponse.json(sortedPredictions);
    } catch (error) {
        console.error(`Error finding potential pairs for wishlist goal:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
