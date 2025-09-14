import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users, userStatusEnum } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logAdminAction } from '@/lib/audit';
import * as Sentry from '@sentry/nextjs';

const updateStatusSchema = z.object({
    status: z.enum(userStatusEnum.enumValues),
});

export async function PATCH(req: Request, props: { params: Promise<{ userId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Admin: updating status for user ${params.userId}`, 'log');

    if (session?.user?.role !== 'admin') {
        Sentry.captureMessage(
            `Forbidden access to admin update user status for ${params.userId}`,
            'warning'
        );
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.user.id === params.userId) {
        Sentry.captureMessage(`Admin trying to change own status: ${session.user.id}`, 'warning');
        return NextResponse.json(
            { error: 'Admins cannot change their own status.' },
            { status: 400 }
        );
    }

    try {
        const body = await req.json();
        const validated = updateStatusSchema.safeParse(body);

        if (!validated.success) {
            Sentry.captureMessage(`Invalid status specified for user ${params.userId}`, 'warning');
            return NextResponse.json({ error: 'Invalid status specified.' }, { status: 400 });
        }

        await db
            .update(users)
            .set({ status: validated.data.status })
            .where(eq(users.id, params.userId));

        await logAdminAction({
            action: 'user.status_update',
            targetType: 'user',
            targetId: params.userId,
            targetUserId: params.userId,
            details: { newStatus: validated.data.status, adminId: session.user.id },
        });

        Sentry.captureMessage(
            `Admin successfully updated status for user ${params.userId} to ${validated.data.status}`,
            'info'
        );
        return NextResponse.json({
            message: 'User status updated successfully.',
        });
    } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
