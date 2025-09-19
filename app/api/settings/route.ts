import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { hash } from 'bcrypt-ts';
import { track } from '@vercel/analytics/server';

const settingsSchema = z.object({
    email: z.string().email().optional(),
    password: z
        .string()
        .min(12, 'Password must be at least 12 characters.')
        .optional()
        .or(z.literal('')),
    collectionItemsPerPage: z.coerce.number().min(3).max(30),
    goalsItemsPerPage: z.coerce.number().min(3).max(30),
    pairsItemsPerPage: z.coerce.number().min(3).max(30),
    theme: z.enum(['light', 'dark', 'system']),
    goalConversions: z.any().optional(),
    bio: z.string().max(500, 'Bio must be 500 characters or less.').optional().nullable(),
    featuredCreatureIds: z
        .array(z.string())
        .max(3, 'You can only feature up to 3 creatures.')
        .optional(),
    featuredGoalIds: z
        .array(z.string())
        .max(3, 'You can only feature up to 3 research goals.')
        .optional(),
    pronouns: z.string().max(50, 'Pronouns must be 50 characters or less.').optional().nullable(),
    socialLinks: z.array(z.string()).optional(),
    showLabLink: z.boolean().optional(),
    statusMessage: z
        .string()
        .max(80, 'Status message must be 80 characters or less.')
        .optional()
        .nullable(),
    statusEmoji: z.string().max(4, 'Invalid emoji.').optional().nullable(),
    showStats: z.boolean().optional(),
    showFriendsList: z.boolean().optional(),
    confirmPassword: z.string().optional(),
});

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validated = settingsSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed in settings', { fieldErrors });
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { password, ...updateData } = validated.data;
        const dataToUpdate: Partial<typeof users.$inferInsert> = {
            ...updateData,
        };

        if (password) {
            dataToUpdate.password = await hash(password, 10);
        }

        if (body.goalConversions) {
            // Logic for goal conversions would go here
        }

        if (Object.keys(dataToUpdate).length > 0) {
            await db.update(users).set(dataToUpdate).where(eq(users.id, userId));
        }

        const username = session.user.username;
        track('settings_updated', { username });
        return NextResponse.json({ message: 'Settings updated successfully!' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
