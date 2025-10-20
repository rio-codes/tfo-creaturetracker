import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { notifications } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const userNotifications = await db.query.notifications.findMany({
            where: eq(notifications.recipientId, session.user.id),
            orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
            limit: 50, // Limit to a reasonable number for initial load
        });

        return NextResponse.json(userNotifications);
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        await db
            .update(notifications)
            .set({ isRead: true })
            .where(
                and(eq(notifications.recipientId, session.user.id), eq(notifications.isRead, false))
            );

        return NextResponse.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Failed to mark notifications as read:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
