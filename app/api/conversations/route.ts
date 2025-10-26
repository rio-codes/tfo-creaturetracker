import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { messages, participants, users } from '@/src/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const userConversations = await db
            .select({ conversationId: participants.conversationId })
            .from(participants)
            .where(eq(participants.userId, userId));

        if (userConversations.length === 0) {
            return NextResponse.json([]);
        }

        const conversationIds = userConversations.map((uc) => uc.conversationId);

        const latestMessagesSubquery = db
            .select({
                id: messages.id,
                content: messages.content,
                createdAt: messages.createdAt,
                conversationId: messages.conversationId,
                rowNumber:
                    sql<number>`ROW_NUMBER() OVER (PARTITION BY ${messages.conversationId} ORDER BY ${messages.createdAt} DESC)`.as(
                        'rn'
                    ),
            })
            .from(messages)
            .where(inArray(messages.conversationId, conversationIds))
            .as('latest_messages_sq');

        const latestMessages = await db
            .select()
            .from(latestMessagesSubquery)
            .where(eq(latestMessagesSubquery.rowNumber, 1));

        const allParticipants = await db
            .select({
                conversationId: participants.conversationId,
                userId: participants.userId,
                username: users.username,
                userImage: users.image,
            })
            .from(participants)
            .innerJoin(users, eq(participants.userId, users.id))
            .where(inArray(participants.conversationId, conversationIds));

        // Group participants by conversation ID to validate them
        const participantsByConversation = allParticipants.reduce(
            (acc, p) => {
                if (!acc[p.conversationId]) {
                    acc[p.conversationId] = [];
                }
                acc[p.conversationId].push(p);
                return acc;
            },
            {} as Record<string, typeof allParticipants>
        );

        // Filter out conversations that don't have exactly 2 participants
        const validConversationIds = Object.keys(participantsByConversation).filter(
            (convId) => participantsByConversation[convId].length === 2
        );

        if (validConversationIds.length === 0) {
            return NextResponse.json([]);
        }

        const enrichedConversations = validConversationIds.map((convId) => {
            const otherParticipants = allParticipants.filter(
                (p) => p.conversationId === convId && p.userId !== userId
            );
            const lastMessage = latestMessages.find((m) => m.conversationId === convId);

            return {
                id: convId,
                otherParticipants,
                lastMessage: lastMessage || null,
            };
        });

        enrichedConversations.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
        });

        return NextResponse.json(enrichedConversations);
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
