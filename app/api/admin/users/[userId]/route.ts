import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { logAdminAction } from '@/lib/audit';
import * as Sentry from '@sentry/nextjs';

export async function DELETE(req: Request, props: { params: Promise<{ userId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Admin: deleting user ${params.userId}`, 'log');

    if (!session?.user?.id || session.user.role !== 'admin') {
        Sentry.captureMessage(`Forbidden access to admin delete user ${params.userId}`, 'warning');
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (params.userId === session.user.id) {
        Sentry.captureMessage(`Admin trying to delete self: ${session.user.id}`, 'warning');
        return NextResponse.json({ error: 'Admins cannot delete themselves.' }, { status: 400 });
    }

    try {
        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, params.userId),
            columns: { username: true, email: true },
        });

        if (!targetUser) {
            Sentry.captureMessage(`Admin: user to delete not found ${params.userId}`, 'warning');
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        await db.delete(users).where(eq(users.id, params.userId));

        await logAdminAction({
            action: 'user.delete',
            targetType: 'user',
            targetId: params.userId,
            targetUserId: params.userId,
            details: {
                deletedUsername: targetUser.username,
                deletedEmail: targetUser.email,
            },
        });

        Sentry.captureMessage(`Admin: successfully deleted user ${params.userId}`, 'info');
        return NextResponse.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Failed to delete user:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
