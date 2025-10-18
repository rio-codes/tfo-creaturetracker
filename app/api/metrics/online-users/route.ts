import { db } from '@/src/db';
import { sessions } from '@/src/db/schema';
import { gt } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET() {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const onlineUsers = await db
            .selectDistinct({ userId: sessions.userId })
            .from(sessions)
            .where(gt(sessions.expires, fiveMinutesAgo));

        const onlineCount = onlineUsers.length;

        return NextResponse.json({ onlineCount });
    } catch (error) {
        console.error('Failed to fetch online user count:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
