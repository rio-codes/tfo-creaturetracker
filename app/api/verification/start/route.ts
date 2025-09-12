import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { accountVerifications } from '@/src/db/schema';
import crypto from 'crypto';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const startSchema = z.object({
    tabId: z.coerce.number().int().min(0, 'Tab ID must be a positive number.'),
});

export async function POST(req: Request) {
    const session = await auth();
    Sentry.captureMessage('Starting account verification', 'log');
    if (!session?.user?.id || !session.user.username) {
        Sentry.captureMessage('Unauthenticated attempt to start verification', 'warning');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = startSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            Sentry.captureMessage(
                `Invalid tab id provided for verification. ${errorMessage}`,
                'warning'
            );
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }
        const { tabId } = validated.data;
        const username = session.user.username;
        const userId = session.user.id;

        const tfoApiUrl = `https://finaloutpost.net/api/v1/tab/${tabId}/${username}`;
        const response = await fetch(tfoApiUrl, {
            headers: { apiKey: process.env.TFO_API_KEY! },
        });
        const data = await response.json();

        if (data.error || !data.creatures || data.creatures.length === 0) {
            Sentry.captureMessage(
                `Could not find creatures in tab for verification: ${username} / Tab ${tabId}`,
                'warning'
            );
            return NextResponse.json(
                {
                    error: `Could not find any creatures in Tab ${tabId} to use for verification.`,
                },
                { status: 404 }
            );
        }

        const randomCreature = data.creatures[Math.floor(Math.random() * data.creatures.length)];
        const creatureCode = randomCreature.code;
        const verificationToken = `verify-${crypto.randomBytes(4).toString('hex')}`;
        const expiresAt = new Date(new Date().getTime() + 15 * 60 * 1000);

        await db
            .insert(accountVerifications)
            .values({
                userId: userId,
                creatureCode: creatureCode,
                verificationToken: verificationToken,
                expiresAt: expiresAt,
            })
            .onConflictDoUpdate({
                target: accountVerifications.userId,
                set: {
                    creatureCode: creatureCode,
                    verificationToken: verificationToken,
                    expiresAt: expiresAt,
                },
            });

        Sentry.captureMessage(`Verification started for user ${userId}`, 'info');
        return NextResponse.json({ creatureCode, verificationToken });
    } catch (error) {
        console.error('Verification start failed:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
