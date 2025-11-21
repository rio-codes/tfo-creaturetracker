import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { syncJobs } from '@/src/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { TFO_Tab } from '@/types/index';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { tabsToSync }: { tabsToSync: TFO_Tab[] } = await req.json();
    if (!tabsToSync || !Array.isArray(tabsToSync)) {
        return NextResponse.json({ error: 'tabsToSync is required' }, { status: 400 });
    }

    const existingJob = await db.query.syncJobs.findFirst({
        where: and(
            eq(syncJobs.ownerId, userId),
            or(eq(syncJobs.status, 'pending'), eq(syncJobs.status, 'running'))
        ),
    });

    if (existingJob) {
        return NextResponse.json(
            { message: 'A sync job is already in progress.', jobId: existingJob.id },
            { status: 409 } // 409 Conflict
        );
    }

    const [newJob] = await db
        .insert(syncJobs)
        .values({
            ownerId: userId,
            status: 'pending',
            details: { tabsToSync },
        })
        .returning();

    if (!newJob) {
        return NextResponse.json({ error: 'Failed to create sync job.' }, { status: 500 });
    }

    fetch(new URL('/api/creatures/sync-worker', req.url), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Use a secret to prevent unauthorized access to the worker
            'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({ jobId: newJob.id }),
    });

    // 4. Respond to the client immediately
    return NextResponse.json(
        { message: 'Sync job started.', jobId: newJob.id },
        { status: 202 } // 202 Accepted
    );
}
