import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { breedingPairs } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { enrichAndSerializeCreature } from '@/lib/serialization';
import { calculateBreedingOutcomes, calculateAllPossibleOutcomes } from '@/lib/genetics';
import type { SpeciesBreedingOutcome } from '@/types';
import { structuredGeneData } from '@/constants/creature-data';

export async function GET(req: Request, props: { params: Promise<{ pairId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const pair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.id, params.pairId),
                eq(breedingPairs.userId, session.user.id)
            ),
            with: {
                maleParent: true,
                femaleParent: true,
            },
        });

        if (!pair || !pair.maleParent || !pair.femaleParent) {
            return NextResponse.json(
                { error: 'Breeding pair not found or parents are missing.' },
                { status: 404 }
            );
        }

        const maleParent = enrichAndSerializeCreature(pair.maleParent!);
        const femaleParent = enrichAndSerializeCreature(pair.femaleParent!);

        const speciesOutcomes = calculateBreedingOutcomes(maleParent, femaleParent);

        const outcomes: SpeciesBreedingOutcome[] = [];

        for (const speciesOutcome of speciesOutcomes) {
            // Create temporary parent objects with the target species to calculate genes correctly
            const tempMale = {
                ...maleParent,
                species: speciesOutcome.species,
                geneData: structuredGeneData[speciesOutcome.species]
                    ? enrichAndSerializeCreature(pair?.maleParent)?.geneData
                    : [],
            };
            const tempFemale = {
                ...femaleParent,
                species: speciesOutcome.species,
                geneData: structuredGeneData[speciesOutcome.species]
                    ? enrichAndSerializeCreature(pair?.femaleParent)?.geneData
                    : [],
            };

            const geneOutcomes = calculateAllPossibleOutcomes(tempMale as any, tempFemale as any);

            outcomes.push({
                species: speciesOutcome.species,
                probability: speciesOutcome.probability,
                geneOutcomes: geneOutcomes,
            });
        }

        return NextResponse.json({ outcomes: outcomes });
    } catch (error: any) {
        console.error('Failed to calculate breeding outcomes:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
