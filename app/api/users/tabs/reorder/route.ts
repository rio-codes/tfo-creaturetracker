import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { userTabs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const reorderSchema = z.object({
    orderedIds: z.array(z.number()),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const validated = reorderSchema.safeParse(body);

    if (!validated.success) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { orderedIds } = validated.data;

    try {
        await db.transaction(async (tx) => {
            for (let i = 0; i < orderedIds.length; i++) {
                const tabId = orderedIds[i];
                await tx.update(userTabs).set({ displayOrder: i }).where(eq(userTabs.id, tabId));
            }
        });

        revalidatePath('/collection');
        return NextResponse.json({ message: 'Tab order updated successfully.' });
    } catch (error) {
        console.error('Failed to reorder tabs:', error);
        return NextResponse.json({ error: 'Failed to reorder tabs.' }, { status: 500 });
    }
}
