import {
    fetchGoalDetailsAndPredictions,
    getAllCreaturesForUser,
    getAllBreedingPairsForUser,
    getAllRawBreedingPairsForUser,
    getAllBreedingLogEntriesForUser,
} from '@/lib/data';
import { auth } from '@/auth';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { GoalDetailClient } from '@/components/custom-clients/goal-detail-client';

export const dynamic = 'force-dynamic';

type Props = {
    params: { goalId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { goal } = await fetchGoalDetailsAndPredictions(params.goalId);
    if (!goal) {
        return {
            title: 'Goal Not Found',
        };
    }
    return {
        title: `Goal: ${goal.name}`,
        description: `Details for the research goal: ${goal.name}`,
        openGraph: {
            title: `Goal: ${goal.name}`,
            description: `Details for the research goal: ${goal.name}`,
            images: goal.imageUrl ? [goal.imageUrl] : [],
        },
    };
}

export default async function GoalDetailPage({ params }: { params: { goalId: string } }) {
    const { goalId } = params;
    const session = await auth();
    if (!session) notFound();

    // Fetch all data in parallel
    const [{ goal, predictions }, allCreaturesData, allPairsData, allRawPairsData, allLogsData] =
        await Promise.all([
            fetchGoalDetailsAndPredictions(goalId),
            getAllCreaturesForUser(),
            getAllBreedingPairsForUser(),
            getAllRawBreedingPairsForUser(),
            getAllBreedingLogEntriesForUser(),
        ]);

    if (!goal) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Suspense fallback={<div className="text-center">Loading goal details...</div>}>
                <GoalDetailClient
                    goal={goal}
                    initialPredictions={predictions}
                    allCreatures={allCreaturesData}
                    allPairs={allPairsData}
                    allRawPairs={allRawPairsData}
                    allLogs={allLogsData}
                />
            </Suspense>
        </div>
    );
}
