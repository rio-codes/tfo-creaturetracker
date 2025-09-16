import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { reports } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logAdminAction } from '@/lib/audit';
import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

const updateStatusSchema = z.object({
    status: z.enum(['open', 'resolved', 'dismissed']),
});

export async function PATCH(req: Request, { params }: { params: { reportId: string } }) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        Sentry.captureMessage(
            `Forbidden access to update report status for ${params.reportId}`,
            'log'
        );
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const validated = updateStatusSchema.safeParse(body);

        if (!validated.success) {
            Sentry.captureMessage(`Invalid status for report ${params.reportId}`, 'log');
            return NextResponse.json({ error: 'Invalid status provided.' }, { status: 400 });
        }

        const { status } = validated.data;
        const { reportId } = params;

        const [updatedReport] = await db
            .update(reports)
            .set({ status })
            .where(eq(reports.id, reportId))
            .returning();

        if (!updatedReport) {
            return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
        }

        await logAdminAction({
            action: 'report.status_update',
            targetType: 'report',
            targetId: reportId,
            targetUserId: updatedReport.reportedId,
            details: { newStatus: status, adminId: session.user.id },
        });

        revalidatePath('/admin/reports');

        Sentry.captureMessage(`Admin updated report ${reportId} to ${status}`, 'info');
        return NextResponse.json({ message: 'Report status updated successfully.' });
    } catch (error) {
        console.error('Failed to update report status:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
