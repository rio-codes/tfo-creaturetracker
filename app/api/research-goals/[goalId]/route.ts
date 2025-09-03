import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals, goalModeEnum } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/audit';
import { put as vercelBlobPut } from '@vercel/blob';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import {
    RegExpMatcher,
    englishRecommendedTransformers,
    DataSet,
    englishDataset,
    pattern,
} from 'obscenity';
import { OBSCENITY_BLACKLIST } from '@/constants/obscenity-blacklist';

const editGoalSchema = z.object({
    name: z
        .string()
        .min(3, 'Goal name must be at least 3 characters.')
        .max(32, 'Goal name can not be more than 32 characters.'),
    species: z.string(),
    genes: z.record(
        z.string(),
        z.object({
            phenotype: z.string(),
            genotype: z.string(),
            isMultiGenotype: z.boolean(),
            isOptional: z.boolean().default(false),
        })
    ),
    goalMode: z.enum(goalModeEnum.enumValues),
});

export async function PATCH(
    req: Request,
    { params }: { params: { goalId: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validatedFields = editGoalSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                {
                    error: 'Invalid data provided.',
                    details: validatedFields.error.flatten(),
                },
                { status: 400 }
            );
        }

        const { name, species, genes, goalMode } = validatedFields.data;

        const customDataSet = new DataSet<{
            originalWord: string;
        }>().addAll(englishDataset);

        OBSCENITY_BLACKLIST.forEach((word) =>
            customDataSet.addPhrase((phrase) =>
                phrase
                    .setMetadata({ originalWord: word })
                    .addPattern(pattern`${word}`)
            )
        );

        const defaultMatcher = new RegExpMatcher({
            ...customDataSet.build(),
            ...englishRecommendedTransformers,
        });

        if (defaultMatcher.hasMatch(name)) {
            return NextResponse.json(
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
        }

        const existingGoal = await db.query.researchGoals.findFirst({
            where: and(
                eq(researchGoals.id, params.goalId),
                eq(researchGoals.userId, userId)
            ),
        });

        if (!existingGoal) {
            return NextResponse.json(
                {
                    error: 'Goal not found or you do not have permission to edit it.',
                },
                { status: 404 }
            );
        }

        let newImageUrl = existingGoal.imageUrl;
        const genesChanged =
            JSON.stringify(existingGoal.genes) !== JSON.stringify(genes);

        if (genesChanged || existingGoal.species !== species) {
            try {
                const genotypesForUrl = Object.fromEntries(
                    Object.entries(genes).map(([category, selection]) => {
                        const geneSelection = selection as { genotype: string };
                        return [category, geneSelection.genotype];
                    })
                );
                const tfoApiUrl = constructTfoImageUrl(
                    species,
                    genotypesForUrl
                );
                const imageResponse = await fetch(tfoApiUrl);
                if (imageResponse.ok) {
                    const imageBlob = await imageResponse.blob();
                    const blob = await vercelBlobPut(
                        `goals/${params.goalId}-${Date.now()}.png`,
                        imageBlob,
                        {
                            access: 'public',
                            contentType: 'image/png',
                            addRandomSuffix: true,
                        }
                    );
                    newImageUrl = blob.url;
                }
            } catch (e) {
                console.error('Failed to generate new goal image', e);
                // Don't block the update if image generation fails
            }
        }

        const [updatedGoal] = await db
            .update(researchGoals)
            .set({
                name,
                species,
                genes,
                goalMode,
                imageUrl: newImageUrl,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(researchGoals.id, params.goalId),
                    eq(researchGoals.userId, userId)
                )
            )
            .returning();

        if (session.user.role === 'admin') {
            await logAdminAction({
                action: 'research_goal.edit',
                targetType: 'research_goal',
                targetId: params.goalId,
                details: {
                    updatedFields: Object.keys(validatedFields.data),
                    goalName: name,
                },
            });
        }

        revalidatePath('/research-goals');
        revalidatePath(`/research-goals/${params.goalId}`);

        return NextResponse.json({ message: 'Goal updated successfully!' });
    } catch (error: any) {
        console.error('Failed to update research goal:', error);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { goalId: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }
    const userId = session.user.id;

    try {
        const [deletedGoal] = await db
            .delete(researchGoals)
            .where(
                and(
                    eq(researchGoals.id, params.goalId),
                    eq(researchGoals.userId, userId)
                )
            )
            .returning();

        if (!deletedGoal) {
            return NextResponse.json(
                {
                    error: 'Goal not found or you do not have permission to delete it.',
                },
                { status: 404 }
            );
        }

        if (session.user.role === 'admin') {
            await logAdminAction({
                action: 'research_goal.delete',
                targetType: 'research_goal',
                targetId: params.goalId,
                details: { deletedGoalName: deletedGoal.name },
            });
        }

        revalidatePath('/research-goals');

        return NextResponse.json({ message: 'Goal deleted successfully.' });
    } catch (error: any) {
        console.error('Failed to delete research goal:', error);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
