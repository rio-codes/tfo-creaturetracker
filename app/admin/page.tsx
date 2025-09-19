import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { db } from '@/src/db';
import { users, creatures, breedingPairs, researchGoals } from '@/src/db/schema';
import { count, gte } from 'drizzle-orm';
import { subDays } from 'date-fns';

type Metrics = {
    totalUsers: number;
    newUsersLastWeek: number;
    totalCreatures: number;
    totalPairs: number;
    totalGoals: number;
};

async function getMetrics(): Promise<Metrics> {
    // This logic is duplicated from the API route, but for a server component
    // it's often better to call the DB directly.
    const [
        totalUsersResult,
        newUsersLastWeekResult,
        totalCreaturesResult,
        totalPairsResult,
        totalGoalsResult,
    ] = await Promise.all([
        db.select({ value: count() }).from(users),
        db
            .select({ value: count() })
            .from(users)
            .where(gte(users.createdAt, subDays(new Date(), 7))),
        db.select({ value: count() }).from(creatures),
        db.select({ value: count() }).from(breedingPairs),
        db.select({ value: count() }).from(researchGoals),
    ]);

    return {
        totalUsers: totalUsersResult[0].value,
        newUsersLastWeek: newUsersLastWeekResult[0].value,
        totalCreatures: totalCreaturesResult[0].value,
        totalPairs: totalPairsResult[0].value,
        totalGoals: totalGoalsResult[0].value,
    };
}

export default async function AdminMetricsPage() {
    const metrics = await getMetrics();

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-dusk-purple dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300">
                            {metrics.totalUsers}
                        </div>
                        <p className="text-xs text-dusk-purple dark:text-purple-400">
                            +{metrics.newUsersLastWeek} in the last 7 days
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
