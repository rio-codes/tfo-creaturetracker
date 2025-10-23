import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { creatures, breedingPairs, breedingLogEntries, researchGoals } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/client-serialization';
import { checkForInbreeding } from '@/lib/breeding-rules';
import { calculateGeneProbability } from '@/lib/genetics';
import type { EnrichedCreature } from '@/types';
import { getPossibleOffspringSpecies } from '@/lib/breeding-rules-client';

type PotentialPairPrediction = {
    maleParent: EnrichedCreature;
    femaleParent: EnrichedCreature;
    averageChance: number;
    isPossible: boolean;
    isInbred: boolean;
    existingPairName?: string;
    existingPairId?: string;
};

export async function GET(request: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;
    const { goalId } = params;

    try {
        const [goal, allUserCreatures, allUserPairs] = await Promise.all([
            db.query.researchGoals.findFirst({
                where: and(eq(researchGoals.id, goalId), eq(researchGoals.userId, userId)),
            }),
            db.query.creatures.findMany({ where: eq(creatures.userId, userId) }),
            db.query.breedingPairs.findMany({ where: eq(breedingPairs.userId, userId) }),
            db.query.breedingLogEntries.findMany({ where: eq(breedingLogEntries.userId, userId) }),
        ]);

        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        const enrichedGoal = enrichAndSerializeGoal(goal, goal.goalMode);

        const existingPairsMap = new Map<string, { name: string; id: string }>();
        for (const pair of allUserPairs) {
            const maleId = pair.maleParentCode;
            existingPairsMap.set(`${maleId}-`, { name: pair.pairName, id: pair.id });
            existingPairsMap.set(`-`, { name: pair.pairName, id: pair.id });
        }

        const enrichedCreatures = allUserCreatures.map(enrichAndSerializeCreature);
        const males = enrichedCreatures.filter((c) => c?.gender === 'male' && c?.growthLevel === 3);
        const females = enrichedCreatures.filter(
            (c) => c?.gender === 'female' && c?.growthLevel === 3
        );

        const combinations: PotentialPairPrediction[] = [];
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

                for (const [category, targetGeneInfo] of Object.entries(enrichedGoal.genes)) {
                    const chance = calculateGeneProbability(
                        male,
                        female,
                        category,
                        targetGeneInfo as any, // This might need a more specific type
                        goal.goalMode
                    );
                    if (!(targetGeneInfo as any).isOptional && chance === 0) {
                        isPossible = false;
                        break;
                    }
                    totalChance += chance;
                    geneCount++;
                }

                if (isPossible) {
                    const isInbred = await checkForInbreeding(
                        { userId: male.userId, code: male.code },
                        { userId: female.userId, code: female.code }
                    );
                    const averageChance = geneCount > 0 ? totalChance / geneCount : 1;
                    const pairKey = `${male.id}-${female.id}`;
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
        console.error(`Error finding potential pairs for goal :`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
