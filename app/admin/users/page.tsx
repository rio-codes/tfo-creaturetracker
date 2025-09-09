import { Suspense } from 'react';
import { AdminDataTable } from '@/components/misc-custom-components/admin-data-table';
import { columns } from './columns';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { and, ilike, or, eq, desc, count, SQL } from 'drizzle-orm';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';

async function fetchAdminUsers(searchParams: {
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
                  ilike(users.username, `%${query}%`),
                  ilike(users.email, `%${query}%`)
              )
            : undefined,
    ].filter(Boolean);

    const where =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const userList = await db.query.users.findMany({
        where,
        orderBy: [desc(users.createdAt)],
        limit,
        offset,
        columns: { password: false },
    });

    const totalCountResult = await db
        .select({ count: count() })
        .from(users)
        .where(where);
    const totalUsers = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalUsers / limit);

    return { users: userList, pagination: { totalPages } };
}

export default async function AdminUsersPage(props: {
    searchParams: Promise<{ page?: string; query?: string }>;
}) {
    const searchParams = await props.searchParams;
    const { users, pagination } = await fetchAdminUsers(searchParams);

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
            <CardHeader>
                <CardTitle className="text-pompaca-purple dark:text-purple-300">
                    User Management
                </CardTitle>
                <CardDescription className="text-dusk-purple dark:text-purple-400">
                    View, search, and manage all registered users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<div>Loading users...</div>}>
                    <AdminDataTable
                        columns={columns}
                        data={users as any}
                        pagination={pagination}
                        searchPlaceholder="Filter by username or email..."
                    />
                </Suspense>
            </CardContent>
        </Card>
    );
}
