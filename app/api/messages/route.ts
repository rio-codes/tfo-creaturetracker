import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { messages, participants } from '@/src/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

const sendMessageSchema = z.object({
    conversationId: z.string(),
    content: z.string().min(1).max(1000),
});

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
        return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    try {
        const [participant] = await db
            .select()
            .from(participants)
            .where(
                and(
                    eq(participants.conversationId, conversationId),
                    eq(participants.userId, session.user.id)
                )
            );

        if (!participant) {
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
        }

        const conversationMessages = await db.query.messages.findMany({
            where: eq(messages.conversationId, conversationId),
            with: {
                sender: {
                    columns: {
                        id: true,
                        username: true,
                        image: true,
                    },
                },
            },
            orderBy: [messages.createdAt], // Order ascending to get oldest first
            limit: 100,
        });
        return NextResponse.json(conversationMessages, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id || !session.user.username) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = sendMessageSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const { conversationId, content } = validated.data;
        const senderId = session.user.id;

        const userIsParticipant = await db.query.participants.findFirst({
            where: and(
                eq(participants.conversationId, conversationId),
                eq(participants.userId, senderId)
            ),
        });

        if (!userIsParticipant) {
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
        }

        const [newMessage] = await db
            .insert(messages)
            .values({ conversationId, senderId, content })
            .returning();

        const otherParticipants = await db
            .select({ id: participants.userId })
            .from(participants)
            .where(
                and(
                    eq(participants.conversationId, conversationId),
                    ne(participants.userId, senderId)
                )
            );

        for (const participant of otherParticipants) {
            await createNotification({
                recipientId: participant.id,
                type: 'new_message',
                data: {
                    senderUsername: session.user.username,
                    messageContent: content,
                    conversationId: conversationId,
                },
                link: `/messages/${conversationId}`,
            });
        }

        const channel = supabase.channel(`conversation:${conversationId}`);
        await channel.send({
            type: 'broadcast',
            event: 'new_message',
            payload: {
                ...newMessage,
                sender: {
                    id: session.user.id,
                    username: session.user.username,
                    image: session.user.image,
                },
            },
        });

        return NextResponse.json(newMessage, { status: 201 });
    } catch (error) {
        console.error('Failed to send message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
