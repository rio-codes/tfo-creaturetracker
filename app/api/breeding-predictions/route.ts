import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { creatures, researchGoals, users } from "@/src/db/schema";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { calculateGeneProbability } from "@/lib/genetics";
import { structuredGeneData } from "@/lib/creature-data";
import type { DbCreature, EnrichedCreature } from "@/types";

// Helper function to enrich and serialize a single creature.
// For long-term maintainability, this could be moved to a shared file like `lib/data.ts`.
const enrichAndSerializeCreature = (creature: DbCreature): EnrichedCreature => {
    if (!creature) return null;
    const speciesGeneData = structuredGeneData[creature.species || ""];
    return {
        ...creature,
        createdAt: creature.createdAt.toISOString(),
        updatedAt: creature.updatedAt.toISOString(),
        gottenAt: creature.gottenAt ? creature.gottenAt.toISOString() : null,
        geneData:
            creature.genetics
                ?.split(",")
                .map((genePair) => {
                    const [category, genotype] = genePair.split(":");
                    if (!category || !genotype || !speciesGeneData) return null;
                    const categoryData = speciesGeneData[category] as {
                        genotype: string;
                        phenotype: string;
                    }[];
                    const matchedGene = categoryData?.find(
                        (g) => g.genotype === genotype
                    );
                    return {
                        category,
                        genotype,
                        phenotype: matchedGene?.phenotype || "Unknown",
                    };
                })
                .filter(Boolean) || [],
    };
};

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

        // Fetch all necessary raw data sequentially to protect the DB connection
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        const maleParentRaw = await db.query.creatures.findFirst({
            where: and(
                eq(creatures.id, maleParentId),
                eq(creatures.userId, userId)
            ),
        });
        const femaleParentRaw = await db.query.creatures.findFirst({
            where: and(
                eq(creatures.id, femaleParentId),
                eq(creatures.userId, userId)
            ),
        });
        const goals =
            goalIds && goalIds.length > 0
                ? await db.query.researchGoals.findMany({
                        where: and(
                            inArray(researchGoals.id, goalIds),
                            eq(researchGoals.userId, userId)
                        ),
                    })
                : [];

        if (!user || !maleParentRaw || !femaleParentRaw) {
            return NextResponse.json(
                { error: "Could not find user or parent creatures." },
                { status: 404 }
            );
        }

        const maleParent = enrichAndSerializeCreature(maleParentRaw);
        const femaleParent = enrichAndSerializeCreature(femaleParentRaw);

        // The existing goal enrichment logic is correct
        const enrichedGoals = goals.map((goal) => {
            const enrichedGenes: { [key: string]: any } = {};
            const speciesGeneData = structuredGeneData[goal.species];
            if (!speciesGeneData || !goal.genes) return { ...goal, genes: {} };

            for (const [category, selection] of Object.entries(goal.genes)) {
                let finalGenotype: string, finalPhenotype: string, isMulti = false;
                if (
                    typeof selection === "object" &&
                    selection?.phenotype &&
                    selection?.genotype
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

                if (goal.goalMode === "phenotype") {
                    const categoryData = speciesGeneData[category] as { phenotype: string }[];
                    const genotypesForPhenotype = categoryData?.filter(g => g.phenotype === finalPhenotype);
                    isMulti = (genotypesForPhenotype?.length || 0) > 1;
                }

                enrichedGenes[category] = {
                    genotype: finalGenotype,
                    phenotype: finalPhenotype,
                    isMultiGenotype: isMulti,
                    isOptional: selection.isOptional ?? false,
                };
            }
            return { ...goal, genes: enrichedGenes };
        });

        const predictions = enrichedGoals.map((goal) => {
            let totalChance = 0;
            let geneCount = 0;
            let isPossible = true;
            for (const [category, targetGeneInfo] of Object.entries(goal.genes)) {
                const targetGene = targetGeneInfo as any;
                const chance = calculateGeneProbability(
                    maleParent,
                    femaleParent,
                    category,
                    targetGene,
                    goal.goalMode
                );
                // Only factor in non-optional genes for possibility and average
                if (!targetGene.isOptional) {
                    if (chance === 0) {
                        isPossible = false;
                    }
                    totalChance += chance;
                    geneCount++;
                }
            }
            const averageChance = geneCount > 0 ? totalChance / geneCount : 1;
            return {
                goalId: goal.id,
                goalName: goal.name,
                averageChance,
                isPossible,
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
