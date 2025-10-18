import { Suspense } from 'react';
import { AdminDataTable } from '@/components/custom-tables/admin-data-table';
import { columns, type EnrichedAuditLogEntry } from './columns';
import { db } from '@/src/db';
import { auditLog, users } from '@/src/db/schema';
import { and, ilike, or, desc, count, SQL, eq, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { alias } from 'drizzle-orm/pg-core';

async function fetchAdminAuditLogs(searchParams: { page?: string; query?: string }) {
    const page = Number(searchParams.page) || 1;
    const limit = 50;
    const query = searchParams.query;
    const offset = (page - 1) * limit;

    const targetUser = alias(users, 'target_user');

    const whereConditions: (SQL | undefined)[] = [
        query
            ? or(
                  ilike(auditLog.adminUsername, `%${query}%`),
                  ilike(auditLog.action, `%${query}%`),
                  ilike(auditLog.targetType, `%${query}%`),
                  ilike(auditLog.targetId, `%${query}%`),
                  ilike(targetUser.username, `%${query}%`),
                  ilike(auditLog.targetUsername, `%${query}%`)
              )
            : undefined,
    ].filter(Boolean);

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const logList = await db
        .select({
            id: auditLog.id,
            timestamp: auditLog.timestamp,
            adminId: auditLog.adminId,
            adminUsername: auditLog.adminUsername,
            action: auditLog.action,
            targetType: auditLog.targetType,
            targetId: auditLog.targetId,
            targetUserId: auditLog.targetUserId,
            details: auditLog.details,
            // Prioritize the username from the audit log table (for deleted items),
            // and fall back to the joined user's table.
            targetUsername: sql<string>`coalesce(${auditLog.targetUsername}, ${targetUser.username})`,
        })
        .from(auditLog)
        .leftJoin(targetUser, eq(auditLog.targetUserId, targetUser.id))
        .where(where)
        .orderBy(desc(auditLog.timestamp))
        .limit(limit)
        .offset(offset);

    const totalCountResult = await db
        .select({ count: count() })
        .from(auditLog)
        .leftJoin(targetUser, eq(auditLog.targetUserId, targetUser.id))
        .where(where);
    const totalLogs = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalLogs / limit);

    return { logs: logList, pagination: { totalPages } };
}

export default async function AdminAuditLogPage(props: {
    searchParams: Promise<{ page?: string; query?: string }>;
}) {
    const searchParams = await props.searchParams;
    const { logs, pagination } = (await fetchAdminAuditLogs(searchParams)) as {
        logs: EnrichedAuditLogEntry[];
        pagination: { totalPages: number };
    };

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50">
            <CardHeader>
                <CardTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                    Audit Log
                </CardTitle>
                <CardDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                    Review all administrative actions performed on the site.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<div>Loading audit logs...</div>}>
                    <AdminDataTable
                        columns={columns}
                        data={logs}
                        pagination={pagination}
                        searchPlaceholder="Filter by admin, action, or target..."
                    />
                </Suspense>
            </CardContent>
        </Card>
    );
}
