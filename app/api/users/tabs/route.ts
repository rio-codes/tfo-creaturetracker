import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { userTabs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hasObscenity } from '@/lib/obscenity';
import { z } from 'zod';

const createTabSchema = z.object({
    tabId: z.number('Tab ID must be a number.'),
    tabName: z.string().max(32, 'Tab name must be 32 characters or less.').optional(),
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
        const { tabId, tabName } = await req.json();
        const validatedTabs = createTabSchema.safeParse({ tabId, tabName });

        if (!validatedTabs.success) {
            const flattenedError = validatedTabs.error.flatten();
            const fullError =
                flattenedError.fieldErrors.tabId || '' + flattenedError.fieldErrors.tabName || '';
            return NextResponse.json(
                {
                    error: `Error: ${fullError}`,
                },
                { status: 400 }
            );
        }

        if (hasObscenity(tabName)) {
            return NextResponse.json(
                { error: 'The provided name contains inappropriate language.' },
                { status: 400 }
            );
        }

        const newTab = await db
            .insert(userTabs)
            .values({ userId, tabId, tabName: tabName || null })
            .returning();

        revalidatePath('/collection');
        return NextResponse.json(newTab[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to add new tab.' }, { status: 500 });
    }
}
