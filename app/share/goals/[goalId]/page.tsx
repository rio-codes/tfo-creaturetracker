import { notFound } from 'next/navigation';
import { db } from '@/src/db';
import { researchGoals, users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { imageSize } from 'image-size';
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
    params: { goalId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const goalId = params.goalId;
    const goal = await db.query.researchGoals.findFirst({
        where: eq(researchGoals.id, goalId),
        columns: { name: true, species: true, userId: true, imageUrl: true },
    });

    if (!goal) {
        return {
            title: 'Goal Not Found',
        };
    }

    const owner = await db.query.users.findFirst({
        where: eq(users.id, goal.userId),
        columns: { username: true },
    });

    const title = `Research Goal: ${goal.name}`;
    const description = `View the research goal "${goal.name}" for the species ${goal.species} on tfo.creaturetracker. Shared by ${owner?.username || 'a user'}.`;

    const ogImageUrl = `/api/share/${goalId}`;

    let imageDimensions: { width: number; height: number } = { width: 500, height: 500 }; // Default fallback

    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tfo.creaturetracker.net';

        // This logic mirrors the API route to determine which image will be served.
        let sourceImageUrl = goal.imageUrl || '/images/misc/placeholder.png';
        if (!sourceImageUrl.startsWith('http')) {
            sourceImageUrl = new URL(sourceImageUrl, baseUrl).toString();
        }

        const imageResponse = await fetch(sourceImageUrl);

        if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            const dimensions = imageSize(Buffer.from(imageBuffer));
            if (dimensions.width && dimensions.height) {
                imageDimensions = { width: dimensions.width, height: dimensions.height };
            }
        } else {
            // If the primary image fails, we know the API will serve the placeholder.
            // So, we get the dimensions of the placeholder.
            const placeholderUrl = new URL('/images/misc/placeholder.png', baseUrl).toString();
            const placeholderResponse = await fetch(placeholderUrl);
            if (placeholderResponse.ok) {
                const placeholderBuffer = await placeholderResponse.arrayBuffer();
                const dimensions = imageSize(Buffer.from(placeholderBuffer));
                if (dimensions.width && dimensions.height) {
                    imageDimensions = { width: dimensions.width, height: dimensions.height };
                }
            }
        }
    } catch (error) {
        console.error(
            `Could not determine image dimensions for goal ${goalId}. Using defaults.`,
            error
        );
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: ogImageUrl,
                    width: imageDimensions.width,
                    height: imageDimensions.height,
                    alt: title,
                },
            ],
            locale: 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
        },
    };
}

export default async function SharedGoalPage({ params }: Props) {
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
        <div className="shared-goal-page-container bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss min-h-screen">
            <main className="container mx-auto px-4 py-8">
                <SharedGoalHeader goal={goal} />
                <div className="text-center my-6">
                    <p className="text-sm md:text-base text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson max-w-3xl mx-auto">
                        This is a research goal from{' '}
                        <a
                            href="https://tfo.creaturetracker.net"
                            className="font-bold underline hover:text-deep-purple dark:hover:text-barely-lilac"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            TFO.creaturetracker.net
                        </a>
                        , a tool for the collectible creature game{' '}
                        <a
                            href="https://finaloutpost.net"
                            className="font-bold underline hover:text-deep-purple dark:hover:text-barely-lilac"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            The Final Outpost
                        </a>
                        , or TFO. This page shows the desired traits for a creature breeding goal,
                        along with potential breeding pairs and their offspring that match those
                        traits.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                    <SharedGoalInfo goal={goal} />
                    <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-border flex flex-col items-center justify-center p-4">
                        <Image
                            width={150}
                            height={150}
                            src={goal.imageUrl || '/images/misc/placeholder.png'}
                            alt={goal.name}
                            className="max-w-full max-h-48 object-contain"
                        />
                    </Card>
                </div>
                <div className="mt-10">
                    <h2 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson mb-4">
                        Breeding Pairs
                    </h2>
                    <SharedPredictionsAccordion predictions={predictions} />
                </div>
                <SharedProgenyAnalysis scoredProgeny={scoredProgeny} />
            </main>
        </div>
    );
}
