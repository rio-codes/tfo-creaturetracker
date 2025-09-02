import { Suspense } from "react";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { columns } from "./columns";
import { db } from "@/src/db";
import { researchGoals, users } from "@/src/db/schema";
import { and, ilike, or, eq, desc, count, SQL } from "drizzle-orm";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

async function fetchAdminResearchGoals(searchParams: {
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
                  ilike(researchGoals.name, `%${query}%`),
                  ilike(researchGoals.species, `%${query}%`),
                  ilike(users.username, `%${query}%`)
              )
            : undefined,
    ].filter(Boolean);

    const where =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const goalList = await db
        .select({
            id: researchGoals.id,
            name: researchGoals.name,
            species: researchGoals.species,
            ownerUsername: users.username,
            createdAt: researchGoals.createdAt,
        })
        .from(researchGoals)
        .leftJoin(users, eq(researchGoals.userId, users.id))
        .where(where)
        .orderBy(desc(researchGoals.createdAt))
        .limit(limit)
        .offset(offset);

    const totalCountResult = await db
        .select({ count: count() })
        .from(researchGoals)
        .leftJoin(users, eq(researchGoals.userId, users.id))
        .where(where);
    const totalGoals = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalGoals / limit);

    return { goals: goalList, pagination: { totalPages } };
}

export default async function AdminResearchGoalsPage({
    searchParams,
}: {
    searchParams: { page?: string; query?: string };
}) {
    const { goals, pagination } = await fetchAdminResearchGoals(searchParams);

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
            <CardHeader>
                <CardTitle className="text-pompaca-purple dark:text-purple-300">
                    Research Goal Management
                </CardTitle>
                <CardDescription className="text-dusk-purple dark:text-purple-400">
                    View and manage all research goals in the database.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<div>Loading research goals...</div>}>
                    <AdminDataTable
                        columns={columns}
                        data={goals as any}
                        pagination={pagination}
                        searchPlaceholder="Filter by name, species, or owner..."
                    />
                </Suspense>
            </CardContent>
        </Card>
    );
}
