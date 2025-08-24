import { fetchFilteredResearchGoals } from "@/lib/data";
import { users } from "@/src/db/schema"
import { ResearchGoalClient } from "@/components/research-goal-client"
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
    const currentPage = Number(searchParams?.page) || 1;
    const query = searchParams?.query;
    const species = searchParams?.species;

    const session = await auth();
    const userId = session?.user?.id
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const goalMode = user?.goalMode


    const { goals, totalPages } = await fetchFilteredResearchGoals(
        currentPage,
        query,
        species
    );

    return (
        <div className="bg-barely-lilac min-h-screen">
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
