import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { userTabs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hasObscenity } from '@/lib/obscenity';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const createTabSchema = z.object({
    tabId: z.number('Tab ID must be a number.'),
    tabName: z
        .string()
        .max(32, 'Tab name must be 32 characters or less.')
        .optional(),
});

// GET all tabs for a user
export async function GET() {
    Sentry.captureMessage('Fetching user tabs', 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage(
            'Unauthenticated attempt to fetch tabs',
            'warning'
        );
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }
    const userId = session.user.id;

    try {
        const tabs = await db.query.userTabs.findMany({
            where: eq(userTabs.userId, userId),
            orderBy: (userTabs, { asc }) => [asc(userTabs.createdAt)],
        });
        Sentry.captureMessage(
            `Successfully fetched tabs for user ${userId}`,
            'info'
        );
        return NextResponse.json(tabs);
    } catch (error) {
        Sentry.captureException(error);
        console.log(error);
        return NextResponse.json(
            { error: 'Failed to fetch user tabs.' },
            { status: 500 }
        );
    }
}

// POST a new tab for a user
export async function POST(req: Request) {
    Sentry.captureMessage('Creating user tab', 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage(
            'Unauthenticated attempt to create tab',
            'warning'
        );
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }
    const userId = session.user.id;

    try {
        const { tabId, tabName } = await req.json();
        const validatedTabs = createTabSchema.safeParse({ tabId, tabName });

        if (!validatedTabs.success) {
            const flattenedError = validatedTabs.error.flatten();
            const fullError =
                flattenedError.fieldErrors.tabId ||
                '' + flattenedError.fieldErrors.tabName ||
                '';
            Sentry.captureMessage(
                `Invalid data for creating tab: ${fullError}`,
                'warning'
            );
            return NextResponse.json(
                {
                    error: `Error: ${fullError}`,
                },
                { status: 400 }
            );
        }

        if (hasObscenity(tabName)) {
            Sentry.captureMessage(
                'Obscene language in new tab name',
                'warning'
            );
            return NextResponse.json(
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
        }

        const newTab = await db
            .insert(userTabs)
            .values({ userId, tabId, tabName: tabName || null })
            .returning();

        Sentry.captureMessage(
            `Tab created successfully for user ${userId}`,
            'info'
        );
        revalidatePath('/collection');
        return NextResponse.json(newTab[0], { status: 201 });
    } catch (error) {
        Sentry.captureException(error);
        console.log(error);
        return NextResponse.json(
            { error: 'Failed to add new tab.' },
            { status: 500 }
        );
    }
}
