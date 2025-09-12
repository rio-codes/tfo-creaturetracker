import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { capsuleAvatars, getRandomCapsuleAvatar } from '@/lib/avatars';
import * as Sentry from '@sentry/nextjs';

export async function POST() {
    Sentry.captureMessage('Changing user avatar', 'log');
    const session = await auth();
    if (!session?.user?.id) {
        Sentry.captureMessage('Unauthenticated attempt to change avatar', 'warning');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            Sentry.captureMessage(`User not found for avatar change: ${userId}`, 'warning');
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentAvatar = user.image || getRandomCapsuleAvatar(userId);

        // Create a pool of avatars to choose from, excluding the current one.
        const allAvatarPaths = capsuleAvatars.map((name) => `/${name}`);
        const potentialAvatars = allAvatarPaths.filter((path) => path !== currentAvatar);

        // If all avatars are the same as the current one (or list is empty), use the full list.
        const selectionPool = potentialAvatars.length > 0 ? potentialAvatars : allAvatarPaths;

        const randomIndex = Math.floor(Math.random() * selectionPool.length);
        const newAvatar = selectionPool[randomIndex];

        await db.update(users).set({ image: newAvatar }).where(eq(users.id, userId));

        Sentry.captureMessage(`Avatar changed successfully for user ${userId}`, 'info');
        return NextResponse.json({ success: true, newAvatar });
    } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
