import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { conversations, participants } from '@/src/db/schema';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

const findOrCreateSchema = z.object({
    recipientId: z.string(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const validated = findOrCreateSchema.safeParse(body);

    if (!validated.success) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { recipientId } = validated.data;
    const currentUserId = session.user.id;

    if (recipientId === currentUserId) {
        return NextResponse.json(
            { error: 'Cannot start a conversation with yourself' },
            { status: 400 }
        );
    }

    try {
        const existingConversation = await db
            .select({ id: participants.conversationId })
            .from(participants)
            .where(
                sql`"conversation_id" IN (
				SELECT "conversation_id" FROM participants
				GROUP BY "conversation_id"
				HAVING COUNT(DISTINCT "user_id") = 2
			) AND "user_id" IN (${currentUserId}, ${recipientId})`
            )
            .groupBy(participants.conversationId)
            .having(sql`COUNT(DISTINCT "user_id") = 2`)
            .limit(1);

        if (existingConversation.length > 0) {
            return NextResponse.json({ conversationId: existingConversation[0].id });
        }

        const [newConversation] = await db.insert(conversations).values({}).returning();

        await db.insert(participants).values([
            { conversationId: newConversation.id, userId: currentUserId },
            { conversationId: newConversation.id, userId: recipientId },
        ]);

        return NextResponse.json({ conversationId: newConversation.id }, { status: 201 });
    } catch (error) {
        console.error('Failed to find or create conversation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
