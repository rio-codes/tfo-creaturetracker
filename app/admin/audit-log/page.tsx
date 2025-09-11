import { Suspense } from 'react';
import { AdminDataTable } from '@/components/custom-tables/admin-data-table';
import { columns } from './columns';
import { db } from '@/src/db';
import { auditLog } from '@/src/db/schema';
import { and, ilike, or, desc, count, SQL } from 'drizzle-orm';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';

async function fetchAdminAuditLogs(searchParams: {
    page?: string;
    query?: string;
}) {
    const page = Number(searchParams.page) || 1;
    const limit = 50;
    const query = searchParams.query;
    const offset = (page - 1) * limit;

    const whereConditions: (SQL | undefined)[] = [
        query
            ? or(
                  ilike(auditLog.adminUsername, `%${query}%`),
                  ilike(auditLog.action, `%${query}%`),
                  ilike(auditLog.targetType, `%${query}%`),
                  ilike(auditLog.targetId, `%${query}%`)
              )
            : undefined,
    ].filter(Boolean);

    const where =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const logList = await db.query.auditLog.findMany({
        where,
        orderBy: [desc(auditLog.timestamp)],
        limit,
        offset,
    });

    const totalCountResult = await db
        .select({ count: count() })
        .from(auditLog)
        .where(where);
    const totalLogs = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalLogs / limit);

    return { logs: logList, pagination: { totalPages } };
}

export default async function AdminAuditLogPage(props: {
    searchParams: Promise<{ page?: string; query?: string }>;
}) {
    const searchParams = await props.searchParams;
    const { logs, pagination } = await fetchAdminAuditLogs(searchParams);

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
            <CardHeader>
                <CardTitle className="text-pompaca-purple dark:text-purple-300">
                    Audit Log
                </CardTitle>
                <CardDescription className="text-dusk-purple dark:text-purple-400">
                    Review all administrative actions performed on the site.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<div>Loading audit logs...</div>}>
                    <AdminDataTable
                        columns={columns}
                        data={logs as any[]}
                        pagination={pagination}
                        searchPlaceholder="Filter by admin, action, or target..."
                    />
                </Suspense>
            </CardContent>
        </Card>
    );
}
