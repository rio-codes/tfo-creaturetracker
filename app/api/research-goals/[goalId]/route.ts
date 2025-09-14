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
import * as Sentry from '@sentry/nextjs';

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

export async function GET(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Fetching goal ${params.goalId}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to fetch goal', 'warning');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;
    const goalId = params.goalId;
    console.log(goalId);

    if (!goalId) {
        Sentry.captureMessage('Goal ID not provided for fetch', 'warning');
        return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    try {
        const goal = await db.query.researchGoals.findFirst({
            where: and(eq(researchGoals.id, goalId), eq(researchGoals.userId, userId)),
        });

        if (!goal) {
            Sentry.captureMessage(`Goal not found: ${goalId}`, 'warning');
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }
        Sentry.captureMessage(`Successfully fetched goal ${goalId}`, 'info');
        return NextResponse.json(goal);
    } catch (error) {
        console.error('Failed to fetch goal:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function PUT(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Admin pinning/unpinning goal ${params.goalId}`, 'log');
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'admin') {
        Sentry.captureMessage('Forbidden access to admin pin goal', 'warning');
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const goalId = params.goalId;
    if (!goalId) {
        Sentry.captureMessage('Goal ID not provided for admin pin', 'warning');
        return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    const { isPinned } = await req.json();

    if (typeof isPinned !== 'boolean') {
        Sentry.captureMessage('Invalid isPinned value for admin pin goal', 'warning');
        return NextResponse.json({ error: 'Invalid value for isPinned' }, { status: 400 });
    }

    try {
        const [updatedGoal] = await db
            .update(researchGoals)
            .set({ isPinned, updatedAt: new Date() })
            .where(eq(researchGoals.id, goalId))
            .returning();

        if (!updatedGoal) {
            Sentry.captureMessage(`Goal not found for admin pin: ${goalId}`, 'warning');
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }
        await logAdminAction({
            action: isPinned ? 'research_goal.admin_pin' : 'research_goal.admin_unpin',
            targetType: 'research_goal',
            targetUserId: updatedGoal.userId,
            targetId: goalId,
            details: { goalName: updatedGoal.name, isPinned },
        });

        revalidatePath('/research-goals');
        revalidatePath(`/research-goals/${goalId}`);

        Sentry.captureMessage(`Admin ${isPinned ? 'pinned' : 'unpinned'} goal ${goalId}`, 'info');
        return NextResponse.json({
            message: `Goal ${isPinned ? 'pinned' : 'unpinned'} successfully`,
            goal: updatedGoal,
        });
    } catch (error) {
        Sentry.captureException(error);
        console.error('Failed to update goal pin status:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function PATCH(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Editing goal ${params.goalId}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to edit goal', 'warning');
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
            Sentry.captureMessage(`Invalid data for creating pair. ${errorMessage}`, 'warning');
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { name, species, genes, goalMode } = validatedFields.data;

        if (hasObscenity(name)) {
            Sentry.captureMessage('Obscene language in goal name', 'warning');
            return NextResponse.json(
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
        }

        const existingGoal = await db.query.researchGoals.findFirst({
            where: and(eq(researchGoals.id, params.goalId), eq(researchGoals.userId, userId)),
        });

        if (!existingGoal) {
            Sentry.captureMessage(`Goal not found for editing: ${params.goalId}`, 'warning');
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
                Sentry.captureException(e);
                console.error('Failed to generate new goal image', e);
                // Don't block the update if image generation fails
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
            })
            .where(and(eq(researchGoals.id, params.goalId), eq(researchGoals.userId, userId)))
            .returning();

        await logAdminAction({
            action: 'research_goal.admin_edit',
            targetType: 'research_goal',
            targetUserId: existingGoal.userId,
            targetId: params.goalId,
            details: { updatedFields: Object.keys(validatedFields.data), goalName: name },
        });

        revalidatePath('/research-goals');
        revalidatePath(`/research-goals/${params.goalId}`);

        Sentry.captureMessage(`Goal ${params.goalId} updated successfully`, 'info');
        return NextResponse.json({ message: 'Goal updated successfully!' });
    } catch (error: any) {
        Sentry.captureException(error);
        console.error('Failed to update research goal:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ goalId: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Deleting goal ${params.goalId}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to delete goal', 'warning');
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
                return null; // Will be handled outside the transaction
            }

            // Now, delete the goal
            await tx.delete(researchGoals).where(eq(researchGoals.id, params.goalId));

            // If the goal was assigned to any pairs, update them
            if (goalToDelete.assignedPairIds && goalToDelete.assignedPairIds.length > 0) {
                // Fetch all pairs that were assigned this goal
                const assignedPairs = await tx.query.breedingPairs.findMany({
                    where: and(
                        eq(breedingPairs.userId, userId),
                        inArray(breedingPairs.id, goalToDelete.assignedPairIds)
                    ),
                    columns: { id: true, assignedGoalIds: true },
                });

                // For each pair, remove the deleted goal's ID from its list
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

            await logAdminAction({
                action: 'research_goal.admin_edit',
                targetType: 'research_goal',
                targetUserId: goalToDelete.userId,
                targetId: params.goalId,
                details: { goalName: goalToDelete.name, action: 'delete' },
            });

            return goalToDelete;
        });

        if (!deletedGoal) {
            Sentry.captureMessage(`Goal not found for deletion: ${params.goalId}`, 'warning');
            return NextResponse.json(
                { error: 'Goal not found or you do not have permission to delete it.' },
                { status: 404 }
            );
        }

        revalidatePath('/research-goals');
        revalidatePath('/breeding-pairs');

        Sentry.captureMessage(`Goal ${params.goalId} deleted successfully`, 'info');
        return NextResponse.json({ message: 'Goal deleted successfully.' });
    } catch (error: any) {
        Sentry.captureException(error);
        console.error('Failed to delete research goal:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
