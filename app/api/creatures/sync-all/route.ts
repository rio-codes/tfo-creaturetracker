import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { userTabs } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';
import { syncTfoTabsAndStream } from '@/lib/tfo-sync-stream';

export const dynamic = 'force-dynamic'; // necessary for streaming

export async function GET() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || !session.user.username) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tfoApiKey = process.env.TFO_API_KEY;
    if (!tfoApiKey) {
        console.error('CRITICAL: TFO_API_KEY is not set.');
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const username = session.user.username;

    const tabsToSync = await db.query.userTabs.findMany({
        where: and(eq(userTabs.userId, userId), eq(userTabs.isSyncEnabled, true)),
        orderBy: (userTabs, { asc }) => [asc(userTabs.displayOrder)],
    });

    if (tabsToSync.length === 0) {
        return NextResponse.json({ error: 'No tabs enabled for syncing.' }, { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            const send = (data: string) => controller.enqueue(encoder.encode(data));

            try {
                const syncGenerator = syncTfoTabsAndStream(userId, username, tabsToSync, tfoApiKey);

                for await (const chunk of syncGenerator) {
                    send(chunk);
                }

                await logUserAction({
                    action: 'sync.run',
                    description: `Synced ${tabsToSync.length} TFO tabs.`,
                });

                revalidatePath('/collection');
            } catch (error) {
                console.error('Streaming sync failed:', error);
                send(
                    `event: error\ndata: ${JSON.stringify({ message: 'An internal server error occurred.' })}\n\n`
                );
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
