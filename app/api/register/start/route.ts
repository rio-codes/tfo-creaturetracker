import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { users, pendingRegistrations } from '@/src/db/schema';
import { eq, or } from 'drizzle-orm';
import { hash } from 'bcrypt-ts';
import crypto from 'crypto';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const startSchema = z.object({
    email: z.email(),
    password: z
        .string()
        .min(12, {
            message: 'Password must be at least 12 characters long',
        })
        .regex(/[a-zA-Z]/, {
            message: 'Password must contain at least one letter.',
        })
        .regex(/[0-9]/, {
            message: 'Password must contain at least one number.',
        })
        .regex(/[^a-zA-Z0-9]/, {
            message: 'Password must contain at least one special character.',
        })
        .trim(),
    tfoUsername: z.string().min(3, 'TFO Username must be at least 3 characters.'),
    tabId: z.int('Tab ID must be a whole number.'),
});

export async function POST(req: Request) {
    Sentry.captureMessage('Starting registration', 'log');
    try {
        const body = await req.json();
        const validated = startSchema.safeParse(body);

        if (!validated.success) {
            const fieldErrors = validated.error.flatten().fieldErrors;
            const allErrorArrays = Object.values(fieldErrors);
            const allErrors = allErrorArrays.flat();
            const errorString = allErrors.join('\n');
            console.error('Zod Validation Failed:', errorString);
            Sentry.captureMessage(
                `Zod validation failed for registration start: ${errorString}`,
                'log'
            );
            return NextResponse.json({ error: errorString }, { status: 400 });
        }

        const { email, password, tfoUsername, tabId } = validated.data;

        const existingUser = await db.query.users.findFirst({
            where: or(eq(users.email, email), eq(users.username, tfoUsername)),
        });
        if (existingUser) {
            Sentry.captureMessage(
                `Registration attempt with existing email/username: ${email}/${tfoUsername}`,
                'log'
            );
            return NextResponse.json(
                {
                    error: 'An account with that email or TFO username already exists.',
                },
                { status: 409 }
            );
        }

        if (!process.env.TFO_API_KEY) {
            const errorMessage = 'Server configuration error: TFO_API_KEY is not set.';
            Sentry.captureException(new Error(errorMessage));
            console.error(errorMessage);
            return NextResponse.json(
                {
                    error: 'An internal error occurred. Cannot verify registration.',
                },
                { status: 500 }
            );
        }

        const labCheckUrl = `https://finaloutpost.net/api/v1/lab/${tfoUsername}`;
        const labResponse = await fetch(labCheckUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiKey': process.env.TFO_API_KEY,
            },
        });
        const labData = await labResponse.json();
        if (labData.error) {
            Sentry.captureMessage(`TFO account not found for registration: ${tfoUsername}`, 'log');
            return NextResponse.json(
                {
                    error: `Could not find a TFO account for username: '${tfoUsername}'. Please check the spelling.`,
                    errorCode: 'NO_ACCOUNT_FOUND',
                },
                { status: 404 }
            );
        }

        const tfoApiUrl = `https://finaloutpost.net/api/v1/tab/0/${tfoUsername}`; // Assuming tab 0
        const response = await fetch(tfoApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiKey': process.env.TFO_API_KEY,
            },
        });
        const tfoData = await response.json();
        if (tfoData.error || !tfoData.creatures || tfoData.creatures.length === 0) {
            Sentry.captureMessage(
                `Empty or hidden tab for registration: ${tfoUsername} / Tab ${tabId}`,
                'log'
            );
            return NextResponse.json(
                {
                    error: `We found your TFO account, but Tab ${tabId} is either empty, hidden, or does not exist. Please provide a different public Tab ID.`,
                    errorCode: 'EMPTY_OR_HIDDEN_TAB',
                },
                { status: 404 }
            );
        }

        const randomCreature =
            tfoData.creatures[Math.floor(Math.random() * tfoData.creatures.length)];
        const creatureCode = randomCreature.code;
        const verificationToken = `verify-${crypto.randomBytes(4).toString('hex')}`;
        const expiresAt = new Date(new Date().getTime() + 15 * 60 * 1000); // 15 minute expiry

        const hashedPassword = await hash(password, 12);

        await db
            .insert(pendingRegistrations)
            .values({
                email,
                tfoUsername,
                hashedPassword,
                creatureCode,
                verificationToken,
                expiresAt,
            })
            .onConflictDoUpdate({
                target: pendingRegistrations.email,
                set: {
                    tfoUsername,
                    hashedPassword,
                    creatureCode,
                    verificationToken,
                    expiresAt,
                },
            });

        Sentry.captureMessage(`Registration started for email: ${email}`, 'info');
        return NextResponse.json({ creatureCode, verificationToken });
    } catch (error) {
        console.error('Registration start failed:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
