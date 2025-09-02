import "server-only";
import { db } from "@/src/db";
import { auditLog } from "@/src/db/schema";
import { auth } from "@/auth";

type AuditLogPayload = {
    action: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, any>;
};

export async function logAdminAction(payload: AuditLogPayload) {
    const session = await auth();
    const adminId = session?.user?.id;
    const adminUsername = session?.user?.username;

    if (!adminId || session.user.role !== "admin") {
        console.warn(
            "Attempted to log an admin action without an admin session."
        );
        return;
    }

    await db.insert(auditLog).values({
        adminId,
        adminUsername,
        ...payload,
    });
}
