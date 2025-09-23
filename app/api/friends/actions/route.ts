import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { friendships, users } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { logUserAction } from '@/lib/user-actions';

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
            console.error('Zod Validation Failed in friends actions', {
                error: validated.error,
            });
            return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
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
                const friendUserRequest = await db.query.users.findFirst({
                    where: eq(users.id, targetUserId),
                });
                await logUserAction({
                    action: 'friend.request',
                    description: `Sent a friend request to ${friendUserRequest?.username}.`,
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
                const friendUserAccept = await db.query.users.findFirst({
                    where: eq(users.id, targetUserId),
                });
                await logUserAction({
                    action: 'friend.accept',
                    description: `Accepted a friend request from ${friendUserAccept?.username}.`,
                });

                return NextResponse.json({ message: 'Friend request accepted.' });

            case 'remove': // Used to reject a request
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
                const friendUserRemove = await db.query.users.findFirst({
                    where: eq(users.id, targetUserId),
                });
                if (existingFriendship.status === 'accepted') {
                    await logUserAction({
                        action: 'friend.remove',
                        description: `Removed ${friendUserRemove?.username} from friends list.`,
                    });
                    return NextResponse.json({ message: 'Friend removed.' });
                } else if (existingFriendship.status === 'pending') {
                    await logUserAction({
                        action: 'friend.decline',
                        description: `Declined pending friend request from ${friendUserRemove?.username}.`,
                    });
                    return NextResponse.json({ message: 'Friend request declined.' });
                }
                return NextResponse.json({ message: 'Friendship removed.' });

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
                const friendUser = await db.query.users.findFirst({
                    where: eq(users.id, targetUserId),
                });
                await logUserAction({
                    action: 'friend.cancel',
                    description: `Cancelled friend request to ${friendUser?.username} .`,
                });
                return NextResponse.json({ message: 'Friend request cancelled.' });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
