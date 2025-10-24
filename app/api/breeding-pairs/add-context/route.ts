import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
    getAllEnrichedCreaturesForUser,
    getAllResearchGoalsForUser,
    getAllRawBreedingPairsForUser,
} from '@/lib/data';

export async function GET(_request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [allCreatures, allGoals, allPairs] = await Promise.all([
            getAllEnrichedCreaturesForUser(),
            getAllResearchGoalsForUser(),
            getAllRawBreedingPairsForUser(),
        ]);

        return NextResponse.json({ allCreatures, allGoals, allPairs });
    } catch (error) {
        console.error('Error fetching add-pair context:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
