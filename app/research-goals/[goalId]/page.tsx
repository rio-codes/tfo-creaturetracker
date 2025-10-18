import { fetchGoalDetailsAndPredictions } from '@/lib/data';
import { GoalDetailClient } from '@/components/custom-clients/goal-detail-client';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = {
    params: Promise<{ goalId: string }>;
};

export default async function GoalDetailPage(props: PageProps) {
    const params = await props.params;
    const { goalId } = params;
    const { goal, predictions } = await fetchGoalDetailsAndPredictions(goalId);

    if (!goal) {
        notFound();
    }

    return (
        <div className="bg-barely-lilac dark:bg-midnight-purple min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div className="text-center">Loading goal details...</div>}>
                    <GoalDetailClient goal={goal!} initialPredictions={predictions!} />
                </Suspense>
            </div>
        </div>
    );
}
