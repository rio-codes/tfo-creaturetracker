import {
    getAllEnrichedCreaturesForUser,
    getAllBreedingPairsForUser,
    getAllResearchGoalsForUser,
    getAllRawBreedingPairsForUser,
    getAllBreedingLogEntriesForUser,
} from '@/lib/data';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [allCreatures, allPairs, allGoals, allRawPairs, allLogs] = await Promise.all([
            getAllEnrichedCreaturesForUser(),
            getAllBreedingPairsForUser(),
            getAllResearchGoalsForUser(),
            getAllRawBreedingPairsForUser(),
            getAllBreedingLogEntriesForUser(),
        ]);

        return NextResponse.json({
            allCreatures,
            allPairs,
            allGoals,
            allRawPairs,
            allLogs,
        });
    } catch (error) {
        console.error('Failed to fetch breeding management data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
