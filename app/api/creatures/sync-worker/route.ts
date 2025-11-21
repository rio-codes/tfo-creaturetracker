import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { syncJobs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { syncTfoTabsAndStream } from '@/lib/tfo-sync-stream'; // Your original sync logic
import { TFO_Tab } from '@/types/index';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
        return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    runJob(jobId).catch((error) => {
        console.error(`[JOB ${jobId}] Unhandled error in runJob:`, error);
    });

    return NextResponse.json({ message: 'Worker accepted job.' }, { status: 202 });
}

async function runJob(jobId: number) {
    try {
        await db
            .update(syncJobs)
            .set({ status: 'running', updatedAt: new Date() })
            .where(eq(syncJobs.id, jobId));

        const job = await db.query.syncJobs.findFirst({
            where: eq(syncJobs.id, jobId),
            with: { owner: true },
        });

        if (!job || !job.owner) {
            throw new Error('Job or user data not found for sync.');
        }

        const tabsToSync = (job.details as { tabsToSync: TFO_Tab[] })?.tabsToSync;

        if (!tabsToSync || !Array.isArray(tabsToSync)) {
            throw new Error('tabsToSync data is missing or invalid in job details.');
        }

        const formattedTabsToSync = tabsToSync.map((tab) => ({
            tabId: tab.id,
            tabName: tab.name,
        }));

        const syncGenerator = syncTfoTabsAndStream(
            job.owner.id,
            job.owner.username,
            formattedTabsToSync,
            job.owner.apiKey!
        );

        let processedCount = 0;
        let totalCount = 0;

        for await (const result of syncGenerator) {
            const eventTypeMatch = result.match(/^event: (.*)\n/);
            const dataMatch = result.match(/^data: (.*)\n\n$/s);

            const eventType = eventTypeMatch ? eventTypeMatch[1] : null;
            const eventData = dataMatch ? JSON.parse(dataMatch[1]) : null;

            if (eventType === 'progress' && eventData) {
                totalCount = eventData.total;
                await db
                    .update(syncJobs)
                    .set({ totalItems: totalCount })
                    .where(eq(syncJobs.id, jobId));
            } else if (eventType === 'creature') {
                processedCount++;
                if (processedCount % 5 === 0 || processedCount === totalCount) {
                    await db
                        .update(syncJobs)
                        .set({
                            processedItems: processedCount,
                            progress: Math.round((processedCount / totalCount) * 100),
                            updatedAt: new Date(),
                        })
                        .where(eq(syncJobs.id, jobId));
                }
            }
        }

        await db
            .update(syncJobs)
            .set({
                status: 'completed',
                progress: 100,
                processedItems: totalCount,
                updatedAt: new Date(),
            })
            .where(eq(syncJobs.id, jobId));

        console.log(`[JOB ${jobId}] Completed successfully.`);
    } catch (error) {
        console.error(`[JOB ${jobId}] Failed:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        await db
            .update(syncJobs)
            .set({ status: 'failed', details: { error: errorMessage }, updatedAt: new Date() })
            .where(eq(syncJobs.id, jobId));
    }
}
