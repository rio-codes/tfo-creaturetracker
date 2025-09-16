import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { userTabs } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hasObscenity } from '@/lib/obscenity';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { logAdminAction } from '@/lib/audit';

const updateTabSchema = z.object({
    tabName: z.string().max(32, 'Tab name must be 32 characters or less.').optional(),
    isSyncEnabled: z.boolean().optional(),
});

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Updating user tab ${params.id}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to update tab', 'log');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();

    const validated = updateTabSchema.safeParse(body);

    if (!validated.success) {
        const flattenedError = validated.error.flatten();
        const fullError = Object.values(flattenedError.fieldErrors).flat().join(' ');
        Sentry.captureMessage(`Invalid data for updating tab: ${fullError}`, 'log');
        return NextResponse.json(
            {
                error: `Error: ${fullError}`,
            },
            { status: 400 }
        );
    }

    const { tabName, isSyncEnabled } = validated.data;
    const tabIdToUpdate = parseInt(params.id, 10);

    try {
        const dataToUpdate: {
            tabName?: string;
            isSyncEnabled?: boolean;
            updatedAt?: Date;
        } = {};

        if (tabName !== undefined) {
            if (hasObscenity(tabName)) {
                Sentry.captureMessage('Obscene language in tab name', 'log');
                return NextResponse.json(
                    { error: 'The provided name contains inappropriate language.' },
                    { status: 400 }
                );
            }
            dataToUpdate.tabName = tabName;
        }

        if (isSyncEnabled !== undefined) dataToUpdate.isSyncEnabled = isSyncEnabled;

        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ message: 'No fields to update.' }, { status: 200 });
        }
        dataToUpdate.updatedAt = new Date();

        const updatedTab = await db
            .update(userTabs)
            .set(dataToUpdate)
            .where(and(eq(userTabs.id, tabIdToUpdate), eq(userTabs.userId, userId)))
            .returning();

        if (updatedTab.length === 0) {
            Sentry.captureMessage(`Tab not found for update: ${tabIdToUpdate}`, 'log');
            return NextResponse.json(
                { error: 'Tab not found or not owned by user.' },
                { status: 404 }
            );
        }
        if (session.user.role === 'admin') {
            await logAdminAction({
                action: 'user_tab.edit',
                targetType: 'user_tab',
                targetUserId: updatedTab[0].userId,
                targetId: tabIdToUpdate.toString(),
                details: {
                    updatedFields: Object.keys(dataToUpdate),
                    tabName: updatedTab[0].tabName,
                },
            });
        }
        Sentry.captureMessage(`Tab ${tabIdToUpdate} updated successfully`, 'info');
        revalidatePath('/collection');
        return NextResponse.json(updatedTab[0]);
    } catch (error) {
        Sentry.captureException(error);
        console.log(error);
        return NextResponse.json({ error: 'Failed to update tab.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Deleting user tab ${params.id}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to delete tab', 'log');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    const tabToDelete = await db.query.userTabs.findFirst({
        where: eq(userTabs.id, parseInt(params.id)),
        columns: { userId: true },
    });
    if (!tabToDelete) {
        Sentry.captureMessage(`Tab not found for deletion: ${params.id}`, 'log');
        return NextResponse.json({ error: 'Tab not found.' }, { status: 404 });
    }

    try {
        await db
            .delete(userTabs)
            .where(
                session.user.role === 'admin'
                    ? eq(userTabs.id, parseInt(params.id))
                    : and(eq(userTabs.id, parseInt(params.id)), eq(userTabs.userId, userId))
            );
        if (session.user.role === 'admin') {
            await logAdminAction({
                action: 'user_tab.delete',
                targetType: 'user_tab',
                targetUserId: tabToDelete?.userId,
                targetId: params.id,
                details: { tabId: params.id, action: 'delete' },
            });
        }
        Sentry.captureMessage(`Tab ${params.id} deleted successfully`, 'info');
        revalidatePath('/collection');
        return NextResponse.json({ message: 'Tab deleted successfully.' });
    } catch (error) {
        Sentry.captureException(error);
        console.log(error);
        return NextResponse.json({ error: 'Failed to delete tab.' }, { status: 500 });
    }
}
