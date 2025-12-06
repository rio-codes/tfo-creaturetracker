import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    try {
        const body = await req.json();
        const user = await db
            .select({
                id: users.id,
                name: users.name,
                username: users.username,
                email: users.email,
                emailVerified: users.emailVerified,
                image: users.image,
                bio: users.bio,
                password: users.password,
                role: users.role,
                status: users.status,
                theme: users.theme,
                allowWishlistGoalSaving: users.allowWishlistGoalSaving,
                collectionItemsPerPage: users.collectionItemsPerPage,
                goalsItemsPerPage: users.goalsItemsPerPage,
                pairsItemsPerPage: users.pairsItemsPerPage,
                apiKey: users.apiKey,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                supporterTier: users.supporterTier,
                featuredCreatureIds: users.featuredCreatureIds,
                featuredGoalIds: users.featuredGoalIds,
                pronouns: users.pronouns,
                socialLinks: users.socialLinks,
                showLabLink: users.showLabLink,
                statusMessage: users.statusMessage,
                statusEmoji: users.statusEmoji,
                showStats: users.showStats,
                showFriendsList: users.showFriendsList,
                preserveFilters: users.preserveFilters,
                showFulfillable: users.showFulfillable,
            })
            .from(users)
            .where(eq(users.id, body.userId))
            .limit(1);

        return NextResponse.json(user ? user[0] : null);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
    }
}
