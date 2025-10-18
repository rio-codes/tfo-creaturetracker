import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function PATCH(req: Request, props: { params: Promise<{ userId: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { userId } = params;
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    try {
        const { tier } = await req.json();
        const validTiers = [
            'admin',
            'beta_tester',
            'researcher',
            'postdoc',
            'assoc_prof',
            'tenured_prof',
        ];
        if (typeof tier !== 'string' || !validTiers.includes(tier)) {
            return NextResponse.json({ error: 'Invalid flair/tier value.' }, { status: 400 });
        }

        const result = await db
            .update(users)
            .set({
                supporterTier: tier as (typeof users.supporterTier.enumValues)[number],
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning({ username: users.username });

        if (result.length === 0) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        revalidatePath(`/admin/users`);
        revalidatePath(`/${result[0].username}`);

        return NextResponse.json({ message: 'User flair updated successfully.' });
    } catch (error) {
        console.error('Failed to update user flair:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
