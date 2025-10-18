import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAllEnrichedCreaturesForUser } from '@/lib/data';

export async function GET(_request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const allCreatures = await getAllEnrichedCreaturesForUser();
        return NextResponse.json(allCreatures);
    } catch (error) {
        console.error('Error fetching all user creatures:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
