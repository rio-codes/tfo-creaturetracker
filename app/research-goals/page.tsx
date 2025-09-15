import { fetchFilteredResearchGoals } from '@/lib/data';
import { ResearchGoalClient } from '@/components/custom-clients/research-goal-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function ResearchGoalsPage(props: {
    searchParams?: Promise<{
        page?: string;
        query?: string;
        species?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const { pinnedGoals, unpinnedGoals, totalPages } =
        await fetchFilteredResearchGoals(searchParams);

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading goals...</div>}>
                    <ResearchGoalClient
                        pinnedGoals={pinnedGoals}
                        unpinnedGoals={unpinnedGoals}
                        totalPages={totalPages}
                    />
                </Suspense>
            </div>
        </div>
    );
}
