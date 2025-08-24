import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { creatures, researchGoals, users } from "@/src/db/schema";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { calculateGeneProbability } from "@/lib/genetics";
import { structuredGeneData } from "@/lib/creature-data"; 

const predictionSchema = z.object({
    maleParentId: z.string().uuid(),
    femaleParentId: z.string().uuid(),
    goalIds: z.array(z.string().uuid()).optional(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = predictionSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json(
                { error: "Invalid input." },
                { status: 400 }
            );
        }
        const { maleParentId, femaleParentId, goalIds } = validated.data;

        // Fetch all necessary data in parallel
        const [user, maleParent, femaleParent, goals] = await Promise.all([
            db.query.users.findFirst({ where: eq(users.id, userId) }),
            db.query.creatures.findFirst({
                where: and(
                    eq(creatures.id, maleParentId),
                    eq(creatures.userId, userId)
                ),
            }),
            db.query.creatures.findFirst({
                where: and(
                    eq(creatures.id, femaleParentId),
                    eq(creatures.userId, userId)
                ),
            }),
            goalIds && goalIds.length > 0
                ? db.query.researchGoals.findMany({
                        where: and(
                            inArray(researchGoals.id, goalIds),
                            eq(researchGoals.userId, userId)
                        ),
                    })
                : Promise.resolve([]),
        ]);

        if (!user || !maleParent || !femaleParent) {
            return NextResponse.json(
                { error: "Could not find user or parent creatures." },
                { status: 404 }
            );
        }

        const enrichedGoals = goals.map((goal) => {
            const enrichedGenes: { [key: string]: any } = {};
            const speciesGeneData = structuredGeneData[goal.species];
            if (!speciesGeneData || !goal.genes) return { ...goal, genes: {} };

            for (const [category, selection] of Object.entries(goal.genes)) {
                let finalGenotype: string, finalPhenotype: string;
                if (
                    typeof selection === "object" &&
                    selection.phenotype &&
                    selection.genotype
                ) {
                    finalGenotype = selection.genotype;
                    finalPhenotype = selection.phenotype;
                } else if (typeof selection === "string") {
                    finalGenotype = selection;
                    const categoryData = speciesGeneData[category] as {
                        genotype: string;
                        phenotype: string;
                    }[];
                    const matchedGene = categoryData?.find(
                        (g) => g.genotype === finalGenotype
                    );
                    finalPhenotype = matchedGene?.phenotype || "Unknown";
                } else continue;
                enrichedGenes[category] = {
                    genotype: finalGenotype,
                    phenotype: finalPhenotype,
                };
            }
            return { ...goal, genes: enrichedGenes };
        });

        // Calculate predictions for each goal
        const predictions = enrichedGoals.map((goal) => {
            let totalChance = 0;
            let geneCount = 0;
            var isPossible = true;
            for (const [category, targetGene] of Object.entries(goal.genes)) {
                const chance = calculateGeneProbability(
                    maleParent,
                    femaleParent,
                    category,
                    targetGene as any,
                    user.goalMode
                );
                if (chance == 0) {
                    isPossible = false;
                }
                totalChance += chance;
                geneCount++;
            }
            const averageChance = geneCount > 0 ? totalChance / geneCount : 0;
            return {
                goalId: goal.id,
                goalName: goal.name,
                averageChance,
                isPossible
            };
        });

        return NextResponse.json({ predictions });
    } catch (error) {
        console.error("Prediction calculation failed:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
