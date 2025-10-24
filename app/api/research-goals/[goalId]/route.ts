import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { researchGoals, goalModeEnum, breedingPairs } from '@/src/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/audit';
import { put as vercelBlobPut } from '@vercel/blob';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { hasObscenity } from '@/lib/obscenity';
import { logUserAction } from '@/lib/user-actions';

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
    isPublic: z.boolean().optional(),
    excludedGenes: z
        .record(
            z.string(),
            z.object({
                phenotype: z.array(z.string()),
            })
        )
        .optional(),
    targetGeneration: z.number().optional().default(1).nullable(),
});

export async function GET(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;
    const goalId = params.goalId;
    console.log(goalId);

    if (!goalId) {
        return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    try {
        const goal = await db.query.researchGoals.findFirst({
            where: and(eq(researchGoals.id, goalId), eq(researchGoals.userId, userId)),
        });

        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }
        return NextResponse.json(goal);
    } catch (error) {
        console.error('Failed to fetch goal:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function PUT(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const goalId = params.goalId;
    if (!goalId) {
        return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    const { isPinned } = await req.json();

    if (typeof isPinned !== 'boolean') {
        return NextResponse.json({ error: 'Invalid value for isPinned' }, { status: 400 });
    }

    try {
        const [updatedGoal] = await db
            .update(researchGoals)
            .set({ isPinned, updatedAt: new Date() })
            .where(eq(researchGoals.id, goalId))
            .returning();

        if (!updatedGoal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        await logUserAction({
            action: 'goal.update',
            description: `Pinned research goal "${updatedGoal.name}"`,
            link: `/research-goals/${updatedGoal.id}`,
        });

        if (session.user.role === 'admin') {
            await logAdminAction({
                action: isPinned ? 'research_goal.admin_pin' : 'research_goal.admin_unpin',
                targetType: 'research_goal',
                targetUserId: updatedGoal.userId,
                targetId: goalId,
                details: { goalName: updatedGoal.name, isPinned },
            });
        }

        revalidatePath('/research-goals');
        revalidatePath(`/research-goals/${goalId}`);

        return NextResponse.json({
            message: `Goal ${isPinned ? 'pinned' : 'unpinned'} successfully`,
            goal: updatedGoal,
        });
    } catch (error) {
        console.error('Failed to update goal pin status:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function PATCH(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validatedFields = editGoalSchema.safeParse(body);

        if (!validatedFields.success) {
            const { fieldErrors } = validatedFields.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { name, species, genes, goalMode, isPublic, excludedGenes, targetGeneration } =
            validatedFields.data;

        if (hasObscenity(name)) {
            return NextResponse.json(
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
        }

        const existingGoal = await db.query.researchGoals.findFirst({
            where: and(eq(researchGoals.id, params.goalId), eq(researchGoals.userId, userId)),
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
        const genesChanged = JSON.stringify(existingGoal.genes) !== JSON.stringify(genes);

        if (genesChanged || existingGoal.species !== species) {
            try {
                const genotypesForUrl = Object.fromEntries(
                    Object.entries(genes).map(([category, selection]) => {
                        const geneSelection = selection as { genotype: string };
                        return [category, geneSelection.genotype];
                    })
                );
                const tfoApiUrl = constructTfoImageUrl(species, genotypesForUrl);
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
            }
        }

        await db
            .update(researchGoals)
            .set({
                name,
                species,
                genes,
                goalMode,
                imageUrl: newImageUrl,
                updatedAt: new Date(),
                isPublic,
                excludedGenes,
                targetGeneration: targetGeneration ?? 1,
            })
            .where(and(eq(researchGoals.id, params.goalId), eq(researchGoals.userId, userId)))
            .returning();

        if (session.user.role === 'admin') {
            await logAdminAction({
                action: 'research_goal.admin_edit',
                targetType: 'research_goal',
                targetUserId: existingGoal.userId,
                targetId: params.goalId,
                details: { updatedFields: Object.keys(validatedFields.data), goalName: name },
            });
        }

        await logUserAction({
            action: 'goal.update',
            description: `Updated research goal "${existingGoal.name}"`,
            link: `/research-goals/${existingGoal.id}`,
        });

        revalidatePath('/research-goals');
        revalidatePath(`/research-goals/${params.goalId}`);

        return NextResponse.json({ message: 'Goal updated successfully!' });
    } catch (error: any) {
        console.error('Failed to update research goal:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const deletedGoal = await db.transaction(async (tx) => {
            // Find the goal first to get its data before deleting
            const goalToDelete = await tx.query.researchGoals.findFirst({
                where: and(eq(researchGoals.id, params.goalId), eq(researchGoals.userId, userId)),
                columns: {
                    id: true,
                    name: true,
                    assignedPairIds: true,
                    userId: true,
                },
            });

            if (!goalToDelete) {
                return null;
            }

            await tx.delete(researchGoals).where(eq(researchGoals.id, params.goalId));

            if (goalToDelete.assignedPairIds && goalToDelete.assignedPairIds.length > 0) {
                const assignedPairs = await tx.query.breedingPairs.findMany({
                    where: and(
                        eq(breedingPairs.userId, userId),
                        inArray(breedingPairs.id, goalToDelete.assignedPairIds)
                    ),
                    columns: { id: true, assignedGoalIds: true },
                });

                for (const pair of assignedPairs) {
                    const updatedGoalIds = (pair.assignedGoalIds || []).filter(
                        (id) => id !== params.goalId
                    );
                    await tx
                        .update(breedingPairs)
                        .set({ assignedGoalIds: updatedGoalIds })
                        .where(eq(breedingPairs.id, pair.id));
                }
            }

            return goalToDelete;
        });

        if (!deletedGoal) {
            return NextResponse.json(
                { error: 'Goal not found or you do not have permission to delete it.' },
                { status: 404 }
            );
        }

        if (session.user.role === 'admin') {
            await logAdminAction({
                action: 'research_goal.admin_edit',
                targetType: 'research_goal',
                targetUserId: deletedGoal.userId,
                targetId: params.goalId,
                details: { goalName: deletedGoal.name, action: 'delete' },
            });
        }

        await logUserAction({
            action: 'goal.delete',
            description: `Deleted research goal "${deletedGoal.name}"`,
        });

        revalidatePath('/research-goals');
        revalidatePath('/breeding-pairs');

        return NextResponse.json({ message: 'Goal deleted successfully.' });
    } catch (error: any) {
        console.error('Failed to delete research goal:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
