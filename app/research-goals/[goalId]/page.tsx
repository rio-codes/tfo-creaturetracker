import { fetchGoalDetailsAndPredictions, getAllCreaturesForUser } from "@/lib/data";
import { GoalDetailClient } from "@/components/goal-detail-client";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { DetailedSerializedGoal, Prediction, SerializedCreature } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = {
    params: {
        goalId: string;
    };
};

type GoalDetailClientProps = {
    goal: DetailedSerializedGoal;
    initialPredictions: Prediction[];
    allCreatures: SerializedCreature[];

};

export default async function GoalDetailPage({ params }: PageProps) {
    const { goalId } = params;
    const { goal, predictions } = await fetchGoalDetailsAndPredictions(goalId);

    const allCreaturesData = await getAllCreaturesForUser()
    const serializableCreatures = allCreaturesData.map((creature) => ({
        ...creature,
        createdAt: creature.createdAt.toISOString(),
        updatedAt: creature.updatedAt.toISOString(),
        gottenAt: creature.gottenAt ? creature.gottenAt.toISOString() : null,
    }));

    if (!goal) {
        notFound();
    }

    return (
        <div className="bg-barely-lilac min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Suspense
                    fallback={
                        <div className="text-center">
                            Loading goal details...
                        </div>
                    }
                >
                    <GoalDetailClient
                        goal={goal!}
                        initialPredictions={predictions}
                        allCreatures={serializableCreatures}
                    />
                </Suspense>
            </div>
        </div>
    );
}
