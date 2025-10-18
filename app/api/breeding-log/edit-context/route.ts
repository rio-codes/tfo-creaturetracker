import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAllEnrichedCreaturesForUser, getAllBreedingLogEntriesForUser } from '@/lib/data';

export async function GET(_request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [allCreatures, allLogs] = await Promise.all([
            getAllEnrichedCreaturesForUser(),
            getAllBreedingLogEntriesForUser(),
        ]);
        return NextResponse.json({ allCreatures, allLogs });
    } catch (error) {
        console.error('Error fetching log editing context:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
