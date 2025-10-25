import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    try {
        const body = await req.json();
        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, body.userId),
            columns: {
                id: true,
                name: true,
                username: true,
                email: true,
                emailVerified: true,
                image: true,
                bio: true,
                password: true,
                role: true,
                status: true,
                theme: true,
                allowWishlistGoalSaving: true,
                collectionItemsPerPage: true,
                goalsItemsPerPage: true,
                pairsItemsPerPage: true,
                apiKey: true,
                createdAt: true,
                updatedAt: true,
                supporterTier: true,
                featuredCreatureIds: true,
                featuredGoalIds: true,
                pronouns: true,
                socialLinks: true,
                showLabLink: true,
                statusMessage: true,
                statusEmoji: true,
                showStats: true,
                showFriendsList: true,
                preserveFilters: true,
                showFulfillable: true,
            },
        });
        return NextResponse.json(user);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
    }
}
