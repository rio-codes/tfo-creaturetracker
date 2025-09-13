import { notFound } from 'next/navigation';
import { db } from '@/src/db';
import { researchGoals, users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import type { Metadata, ResolvingMetadata } from 'next';
import { SharedGoalHeader } from '@/components/shared-views/shared-goal-header';
import { SharedGoalInfo } from '@/components/shared-views/shared-goal-info';
import { SharedPredictionsAccordion } from '@/components/shared-views/shared-predictions-accordion';
import { SharedProgenyAnalysis } from '@/components/shared-views/shared-progeny-analysis';
import { Card } from '@/components/ui/card';
import { getGoalById, getPredictionsForGoal, getAssignedPairsForGoal } from '@/lib/api/goals';
import { analyzeProgenyAgainstGoal } from '@/lib/goal-analysis';
import Image from 'next/image';
import { EnrichedCreature } from '@/types';

type Props = {
    params: Promise<{ goalId: string }>;
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const goalId = (await params).goalId;
    const goal = await db.query.researchGoals.findFirst({
        where: eq(researchGoals.id, goalId),
    });

    if (!goal) {
        return {
            title: 'Goal Not Found',
        };
    }

    const owner = await db.query.users.findFirst({
        where: eq(users.id, goal.userId),
    });

    const title = `Research Goal: ${goal.name}`;
    const description = `View the research goal "${goal.name}" for the species ${goal.species} on tfo.creaturetracker. Shared by ${owner?.username || 'a user'}.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: `/share/goals/${goalId}/opengraph-image`,
                    width: 1200,
                    height: 630,
                },
            ],
        },
    };
}

export default async function SharedGoalPage(props: Props) {
    const params = await props.params;
    const goal = await getGoalById(params.goalId);

    if (!goal) {
        notFound();
    }

    const predictions = await getPredictionsForGoal(params.goalId);
    const assignedPairsWithProgeny = await getAssignedPairsForGoal(params.goalId);

    const progenyWithPairInfo = assignedPairsWithProgeny.flatMap((p) =>
        (p.progeny || [])
            .filter((prog) => prog && prog.growthLevel === 3)
            .map((prog) => ({
                ...prog,
                parentPairName: p.pairName || 'Unnamed Pair',
            }))
    );

    const allAssignedProgeny = Array.from(
        new Map(progenyWithPairInfo.map((p) => [p.id, p])).values()
    ).filter((p): p is EnrichedCreature & { parentPairName: string } => !!p.id);

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
                        <Image
                            src={goal.imageUrl || '/placeholder.png'}
                            alt={goal.name}
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
        </div>
    );
}
