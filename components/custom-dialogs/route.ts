import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { userTabs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logUserAction } from '@/lib/user-actions';

const reorderSchema = z.object({
    orderedIds: z.array(z.number()),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = reorderSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
        }

        const { orderedIds } = validated.data;

        await db.transaction(async (tx) => {
            for (const [index, id] of orderedIds.entries()) {
                await tx.update(userTabs).set({ displayOrder: index }).where(eq(userTabs.id, id));
            }
        });

        await logUserAction({ action: 'user_tab.reorder', description: 'Reordered sync tabs.' });
        revalidatePath('/collection');
        return NextResponse.json({ message: 'Tab order updated successfully.' });
    } catch (error) {
        console.error('Failed to reorder tabs:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
