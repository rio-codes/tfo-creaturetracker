import { fetchFilteredResearchGoals, getAllEnrichedCreaturesForUser } from '@/lib/data';
import { ResearchGoalClient } from '@/components/custom-clients/research-goal-client';
import { Suspense } from 'react';

import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import type { EnrichedResearchGoal, User } from '@/types'; // Make sure User is imported
export const dynamic = 'force-dynamic';

export default async function ResearchGoalsPage(props: {
    searchParams?: {
        // This should not be a Promise
        page?: string;
        query?: string;
        species?: string;
    };
}) {
    const searchParams = props.searchParams || {};
    const session = await auth();

    const [{ pinnedGoals, unpinnedGoals, achievedGoals, totalPages }, currentUser, allCreatures] =
        await Promise.all([
            fetchFilteredResearchGoals(searchParams),
            session?.user?.id
                ? (db.query.users.findFirst({
                      where: eq(users.id, session.user.id),
                      columns: { password: false },
                  }) as Promise<User | undefined>) // Cast to the correct type
                : Promise.resolve(undefined),
            getAllEnrichedCreaturesForUser(),
        ]);

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div className="text-center text-lg">Loading goals...</div>}>
                    <ResearchGoalClient
                        pinnedGoals={pinnedGoals}
                        unpinnedGoals={unpinnedGoals}
                        achievedGoals={achievedGoals as EnrichedResearchGoal[]}
                        totalPages={totalPages}
                        currentUser={currentUser ?? null} // Pass the currentUser prop
                        allCreatures={allCreatures}
                    />
                </Suspense>
            </div>
        </div>
    );
}
