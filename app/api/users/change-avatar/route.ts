import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { capsuleAvatars, getRandomCapsuleAvatar } from '@/lib/avatars';

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentAvatar = user.image || getRandomCapsuleAvatar(userId);

        const allAvatarPaths = capsuleAvatars.map((name) => `/images/capsules/${name}`);
        const potentialAvatars = allAvatarPaths.filter((path) => path !== currentAvatar);

        const selectionPool = potentialAvatars.length > 0 ? potentialAvatars : allAvatarPaths;

        const randomIndex = Math.floor(Math.random() * selectionPool.length);
        const newAvatar = selectionPool[randomIndex];

        await db.update(users).set({ image: newAvatar }).where(eq(users.id, userId));

        return NextResponse.json({ success: true, newAvatar });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
