import { fetchFilteredResearchGoals } from "@/lib/data";
import { users } from "@/src/db/schema"
import { ResearchGoalClient } from "@/components/custom-clients/research-goal-client"
import { Suspense } from "react";
import { db } from "@/src/db"
import { auth } from "@/auth"
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ResearchGoalsPage({
    searchParams,
}: {
    searchParams?: {
        page?: string;
        query?: string;
        species?: string;
    };
}) {
    const session = await auth();
    const userId = session?.user?.id
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const goalMode = user?.goalMode


    const { goals, totalPages } = await fetchFilteredResearchGoals(searchParams);

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading goals...</div>}>
                    <ResearchGoalClient
                        goalMode={goalMode}
                        initialGoals={goals}
                        totalPages={totalPages}
                    />
                </Suspense>
            </div>
        </div>
    );
}
