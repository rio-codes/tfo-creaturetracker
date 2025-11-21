import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { syncJobs } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { jobId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const jobId = parseInt(params.jobId, 10);

    if (isNaN(jobId)) {
        return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const job = await db.query.syncJobs.findFirst({
        where: and(eq(syncJobs.id, jobId), eq(syncJobs.ownerId, userId)),
    });

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
}
