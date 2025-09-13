import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { userTabs } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hasObscenity } from '@/lib/obscenity';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const updateTabSchema = z.object({
    tabId: z.number('Tab ID must be a number.'),
    tabName: z.string().max(32, 'Tab name must be 32 characters or less.').optional(),
});

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    Sentry.captureMessage(`Updating user tab ${params.id}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to update tab', 'warning');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    const { tabId, tabName, isSyncEnabled } = await req.json();

    const validatedTabs = updateTabSchema.safeParse({ tabId, tabName });

    if (!validatedTabs.success) {
        const flattenedError = validatedTabs.error.flatten();
        const fullError =
            flattenedError.fieldErrors.tabId || '' + flattenedError.fieldErrors.tabName || '';
        Sentry.captureMessage(`Invalid data for creating tab: ${fullError}`, 'warning');
        return NextResponse.json(
            {
                error: `Error: ${fullError}`,
            },
            { status: 400 }
        );
    }

    const tabIdToUpdate = parseInt(params.id, 10);

    try {
        const dataToUpdate: {
            tabName?: string;
            isSyncEnabled?: boolean;
            updatedAt: Date;
        } = { updatedAt: new Date() };

        if (hasObscenity(tabName)) {
            Sentry.captureMessage('Obscene language in tab name', 'warning');
            return NextResponse.json(
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
        }

        if (tabName !== undefined) dataToUpdate.tabName = tabName;

        if (isSyncEnabled !== undefined) dataToUpdate.isSyncEnabled = isSyncEnabled;

        const updatedTab = await db
            .update(userTabs)
            .set(dataToUpdate)
            .where(and(eq(userTabs.id, tabIdToUpdate), eq(userTabs.userId, userId)))
            .returning();

        if (updatedTab.length === 0) {
            Sentry.captureMessage(`Tab not found for update: ${tabIdToUpdate}`, 'warning');
            return NextResponse.json(
                { error: 'Tab not found or not owned by user.' },
                { status: 404 }
            );
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
        Sentry.captureMessage('Unauthenticated attempt to delete tab', 'warning');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;
    const tabIdToDelete = parseInt(params.id, 10);

    try {
        await db
            .delete(userTabs)
            .where(and(eq(userTabs.id, tabIdToDelete), eq(userTabs.userId, userId)));
        Sentry.captureMessage(`Tab ${tabIdToDelete} deleted successfully`, 'info');
        revalidatePath('/collection');
        return NextResponse.json({ message: 'Tab deleted successfully.' });
    } catch (error) {
        Sentry.captureException(error);
        console.log(error);
        return NextResponse.json({ error: 'Failed to delete tab.' }, { status: 500 });
    }
}
