import { db } from '@/src/db';
import { messages, participants, users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { MessageViewClient } from './message-view-client';
import { auth } from '@/auth';
import { type MessageWithSender, type EnrichedConversation } from '@/lib/definitions';

export const dynamic = 'force-dynamic';

type PageProps = {
    params: Promise<{ conversationId: string }>;
};

async function getConversationData(conversationId: string, userId: string) {
    const [conversationMessages, conversationParticipants] = await Promise.all([
        db.query.messages.findMany({
            where: eq(messages.conversationId, conversationId),
            with: { sender: { columns: { id: true, username: true, image: true } } },
            orderBy: [messages.createdAt],
        }),
        db
            .select({
                userId: participants.userId,
                username: users.username,
                userImage: users.image,
            })
            .from(participants)
            .innerJoin(users, eq(participants.userId, users.id))
            .where(eq(participants.conversationId, conversationId)),
    ]);

    const otherParticipants = conversationParticipants.filter((p) => p.userId !== userId);

    const initialConversation: EnrichedConversation = {
        id: conversationId,
        otherParticipants: otherParticipants,
        lastMessage: conversationMessages[conversationMessages.length - 1] || null,
    };

    return { initialMessages: conversationMessages as MessageWithSender[], initialConversation };
}

export default async function MessagePage(props: PageProps) {
    const params = await props.params;
    const { conversationId } = params;
    const session = await auth();
    if (!session?.user?.id) notFound();

    const { initialMessages, initialConversation } = await getConversationData(
        conversationId,
        session.user.id
    );

    return (
        <MessageViewClient
            conversationId={conversationId}
            initialMessages={initialMessages}
            initialConversation={initialConversation}
        />
    );
}
