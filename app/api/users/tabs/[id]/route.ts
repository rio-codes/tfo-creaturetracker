import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { userTabs } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hasObscenity } from '@/lib/obscenity';
import * as Sentry from '@sentry/nextjs';

// PATCH to update a tab
export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    Sentry.captureMessage(`Updating user tab ${params.id}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage(
            'Unauthenticated attempt to update tab',
            'warning'
        );
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }
    const userId = session.user.id;
    const tabIdToUpdate = parseInt(params.id, 10);

    try {
        const { tabName, isSyncEnabled } = await req.json();

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

        if (isSyncEnabled !== undefined)
            dataToUpdate.isSyncEnabled = isSyncEnabled;

        const updatedTab = await db
            .update(userTabs)
            .set(dataToUpdate)
            .where(
                and(eq(userTabs.id, tabIdToUpdate), eq(userTabs.userId, userId))
            )
            .returning();

        if (updatedTab.length === 0) {
            Sentry.captureMessage(
                `Tab not found for update: ${tabIdToUpdate}`,
                'warning'
            );
            return NextResponse.json(
                { error: 'Tab not found or not owned by user.' },
                { status: 404 }
            );
        }

        Sentry.captureMessage(
            `Tab ${tabIdToUpdate} updated successfully`,
            'info'
        );
        revalidatePath('/collection');
        return NextResponse.json(updatedTab[0]);
    } catch (error) {
        Sentry.captureException(error);
        console.log(error);
        return NextResponse.json(
            { error: 'Failed to update tab.' },
            { status: 500 }
        );
    }
}

// DELETE a tab
export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    Sentry.captureMessage(`Deleting user tab ${params.id}`, 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage(
            'Unauthenticated attempt to delete tab',
            'warning'
        );
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }
    const userId = session.user.id;
    const tabIdToDelete = parseInt(params.id, 10);

    try {
        await db
            .delete(userTabs)
            .where(
                and(eq(userTabs.id, tabIdToDelete), eq(userTabs.userId, userId))
            );
        Sentry.captureMessage(
            `Tab ${tabIdToDelete} deleted successfully`,
            'info'
        );
        revalidatePath('/collection');
        return NextResponse.json({ message: 'Tab deleted successfully.' });
    } catch (error) {
        Sentry.captureException(error);
        console.log(error);
        return NextResponse.json(
            { error: 'Failed to delete tab.' },
            { status: 500 }
        );
    }
}
