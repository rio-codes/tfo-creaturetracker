import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { friendships } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const actionSchema = z.object({
    targetUserId: z.string(),
    action: z.enum(['request', 'accept', 'remove', 'cancel']),
});

// Helper to ensure consistent ordering of user IDs in the database
function getOrderedUserIds(userId1: string, userId2: string) {
    return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const currentUserId = session.user.id;

    try {
        const body = await req.json();
        const validated = actionSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { targetUserId, action } = validated.data;

        if (currentUserId === targetUserId) {
            return NextResponse.json(
                { error: 'Cannot perform actions on yourself' },
                { status: 400 }
            );
        }

        const [userOneId, userTwoId] = getOrderedUserIds(currentUserId, targetUserId);

        const existingFriendship = await db.query.friendships.findFirst({
            where: and(eq(friendships.userOneId, userOneId), eq(friendships.userTwoId, userTwoId)),
        });

        switch (action) {
            case 'request':
                if (existingFriendship) {
                    return NextResponse.json(
                        { error: 'Friendship status already exists.' },
                        { status: 409 }
                    );
                }
                await db.insert(friendships).values({
                    userOneId,
                    userTwoId,
                    status: 'pending',
                    actionUserId: currentUserId,
                });
                return NextResponse.json({ message: 'Friend request sent.' });

            case 'accept':
                if (
                    !existingFriendship ||
                    existingFriendship.status !== 'pending' ||
                    existingFriendship.actionUserId === currentUserId
                ) {
                    return NextResponse.json(
                        { error: 'No pending request to accept or you sent the request.' },
                        { status: 400 }
                    );
                }
                await db
                    .update(friendships)
                    .set({ status: 'accepted', actionUserId: currentUserId })
                    .where(
                        and(
                            eq(friendships.userOneId, userOneId),
                            eq(friendships.userTwoId, userTwoId)
                        )
                    );
                return NextResponse.json({ message: 'Friend request accepted.' });

            case 'remove': // Used to reject a request
            case 'cancel': // Used to withdraw a sent request
                if (!existingFriendship) {
                    return NextResponse.json(
                        { error: 'No friendship to remove.' },
                        { status: 404 }
                    );
                }
                await db
                    .delete(friendships)
                    .where(
                        and(
                            eq(friendships.userOneId, userOneId),
                            eq(friendships.userTwoId, userTwoId)
                        )
                    );

                if (action === 'remove' && existingFriendship.status === 'accepted')
                    return NextResponse.json({ message: 'Friend removed.' });
                if (action === 'remove' && existingFriendship.status === 'pending')
                    return NextResponse.json({ message: 'Friend request declined.' });
                if (action === 'cancel')
                    return NextResponse.json({ message: 'Friend request cancelled.' });

                return NextResponse.json({ message: 'Friendship status cleared.' });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
