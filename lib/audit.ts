import 'server-only';
import { db } from '@/src/db';
import { auditLog } from '@/src/db/schema';
import { auth } from '@/auth';

type AuditLogPayload = {
    action: string;
    targetType?: string;
    targetId?: string;
    targetUserId?: string;
    details?: Record<string, any>;
};

export async function logAdminAction(payload: AuditLogPayload) {
    const session = await auth();
    const adminId = session?.user?.id;
    const adminUsername = session?.user?.username;

    if (!adminId || session.user.role !== 'admin') {
        console.warn('Attempted to log an admin action without an admin session.');
        return;
    }

    // Do not log actions that admins perform on their own items.
    if (adminId === payload.targetUserId) {
        return;
    }

    await db.insert(auditLog).values({
        adminId,
        adminUsername,
        ...payload,
        targetUserId: payload.targetUserId || null, // Ensure targetUserId is explicitly set to null if undefined
    });
}
