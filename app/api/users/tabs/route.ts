import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { userTabs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hasObscenity } from '@/lib/obscenity';
import { z } from 'zod';
import { logUserAction } from '@/lib/user-actions';
import { logAdminAction } from '@/lib/audit';

const createTabSchema = z.object({
    tabId: z.number('Tab ID must be a number.'),
    tabName: z.string().max(32, 'Tab name must be 32 characters or less.').nullable().optional(),
});

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const tabs = await db.query.userTabs.findMany({
            where: eq(userTabs.userId, userId),
            orderBy: (userTabs, { asc }) => [asc(userTabs.createdAt)],
        });
        return NextResponse.json(tabs);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch user tabs.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validatedTabs = createTabSchema.safeParse(body);

        if (!validatedTabs.success) {
            const { fieldErrors } = validatedTabs.error.flatten();
            const errorMessage = Object.values(fieldErrors).flat().join(' ');
            return NextResponse.json(
                {
                    error: `Error: ${errorMessage || 'Invalid input.'}`,
                },
                { status: 400 }
            );
        }
        if (!validatedTabs.data.tabName) {
            validatedTabs.data.tabName = `Tab ${validatedTabs.data.tabId}`;
        }

        const { tabId, tabName } = validatedTabs.data;

        if (tabName && hasObscenity(tabName)) {
            return NextResponse.json(
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
        }

        const newTab = await db.insert(userTabs).values({ userId, tabId, tabName }).returning();

        revalidatePath('/collection');

        await logUserAction({
            action: 'user_tab.create',
            description: `Created user tab "${tabName}" with tab ID ${tabId}.`,
        });

        return NextResponse.json(newTab[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to add new tab.' }, { status: 500 });
    }
}
