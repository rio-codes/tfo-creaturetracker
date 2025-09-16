import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request): Promise<NextResponse> {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename || !request.body) {
        return NextResponse.json({ error: 'No filename or body provided' }, { status: 400 });
    }

    const blob = await put(`avatars/${session.user.id}-${Date.now()}-${filename}`, request.body, {
        access: 'public',
    });

    // Update user's image URL in the database
    await db.update(users).set({ image: blob.url }).where(eq(users.id, session.user.id));

    return NextResponse.json(blob);
}
