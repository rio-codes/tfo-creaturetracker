import { fetchFilteredResearchGoals, getAllEnrichedCreaturesForUser } from '@/lib/data';
import { ResearchGoalClient } from '@/components/custom-clients/research-goal-client';
import { Suspense } from 'react';

import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@/types';
export const dynamic = 'force-dynamic';

export default async function ResearchGoalsPage(props: {
    searchParams?: Promise<{
        page?: string;
        query?: string;
        species?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const session = await auth();

    const [{ pinnedGoals, unpinnedGoals, totalPages }, currentUser, allCreatures] =
        await Promise.all([
            fetchFilteredResearchGoals(searchParams),
            session?.user?.id
                ? (db.query.users.findFirst({
                      where: eq(users.id, session.user.id),
                      columns: { password: false },
                  }) as Promise<User | undefined>)
                : Promise.resolve(undefined),
            getAllEnrichedCreaturesForUser(),
        ]);

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading goals...</div>}>
                    <ResearchGoalClient
                        pinnedGoals={pinnedGoals}
                        unpinnedGoals={unpinnedGoals}
                        totalPages={totalPages}
                        currentUser={currentUser ?? null}
                        allCreatures={allCreatures}
                    />
                </Suspense>
            </div>
        </div>
    );
}
