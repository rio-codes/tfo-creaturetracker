import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { useSession } from 'next-auth/react';
import { Footer } from '@/components/custom-layout-elements/footer';
import { SharedGoalHeader } from '@/components/shared-views/shared-goal-header';
import { SharedGoalInfo } from '@/components/shared-views/shared-goal-info';
import { SharedPredictionsAccordion } from '@/components/shared-views/shared-predictions-accordion';
import { SharedProgenyAnalysis } from '@/components/shared-views/shared-progeny-analysis';
import { Card } from '@/components/ui/card';
import {
    getGoalById,
    getPredictionsForGoal,
    getAssignedPairsForGoal,
} from '@/lib/api/goals';
import { analyzeProgenyAgainstGoal } from '@/lib/goal-analysis';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

type Props = {
    params: { goalId: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const urlParams = await params;
    const goalForMetadata = getGoalById(urlParams.goalId);

    if (!goalForMetadata) {
        return {};
    }

    const previousImages = (await parent).openGraph?.images || [];
    const description = `${(await goalForMetadata).user?.username || 'A user'} made this goal on TFO.creaturetracker, check it out! TFO.creaturetracker helps you track your creature breeding projects.`;

    return {
        title: `Shared Goal: ${(await goalForMetadata).name}`,
        description,
        openGraph: {
            title: `Shared Goal: ${(await goalForMetadata).name}`,
            description,
            images: [(await goalForMetadata).imageUrl, ...previousImages],
            url: `/share/goals/${(await goalForMetadata).id}`,
            siteName: 'TFO.creaturetracker',
        },
    };
}

export default async function SharedGoalPage({ params }: Props) {
    const urlParams = await params;
    const goal = await getGoalById(urlParams.goalId);
    if (!urlParams.goalId || !goal) {
        notFound();
    }
    const predictions = await getPredictionsForGoal(params.goalId);
    const allPairs = await getAssignedPairsForGoal(params.goalId);

    if (!goal || !predictions || !allPairs) {
        notFound();
    }

    const progenyWithPairInfo = allPairs.flatMap((p) =>
        (p.progeny || [])
            .filter((prog) => prog.growthLevel === 3)
            .map((prog) => ({
                ...prog,
                parentPairName: p.pairName || 'Unnamed Pair',
            }))
    );

    // Deduplicate progeny in case it's part of multiple assigned pairs
    const allAssignedProgeny = Array.from(
        new Map(progenyWithPairInfo.map((p) => [p.id, p])).values()
    );

    const scoredProgeny = allAssignedProgeny
        .map((p) => ({
            ...p,
            analysis: analyzeProgenyAgainstGoal(p, goal, true),
        }))
        .sort((a, b) => b.analysis.score - a.analysis.score);

    return (
        <div className="shared-goal-page-container bg-barely-lilac dark:bg-deep-purple min-h-screen">
            <main className="container mx-auto px-4 py-8">
                <SharedGoalHeader goal={goal} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                    <SharedGoalInfo goal={goal} />
                    <Card className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 border-border flex flex-col items-center justify-center p-4">
                        <img
                            src={(await goal).imageUrl}
                            alt={(await goal).name}
                            className="max-w-full max-h-48 object-contain"
                        />
                    </Card>
                </div>
                <div className="mt-10">
                    <h2 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300 mb-4">
                        Breeding Pairs
                    </h2>
                    <SharedPredictionsAccordion predictions={predictions} />
                </div>
                <SharedProgenyAnalysis scoredProgeny={scoredProgeny} />
            </main>
            <Footer />
        </div>
    );
}
