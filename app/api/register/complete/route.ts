import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { users, pendingRegistrations } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const completeSchema = z.object({
    email: z.email('A valid email is required.'),
});

export async function POST(req: Request) {
    Sentry.captureMessage('Completing registration', 'log');
    try {
        const body = await req.json();
        const validated = completeSchema.safeParse(body);
        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            Sentry.captureMessage(
                `Email invalid for completing registration. ${errorMessage}`,
                'warning'
            );
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }
        const { email } = validated.data;

        const pending = await db.query.pendingRegistrations.findFirst({
            where: eq(pendingRegistrations.email, email),
        });

        if (!pending) {
            Sentry.captureMessage(
                `No pending registration found for this email. Please start over.`,
                'warning'
            );
            return NextResponse.json(
                {
                    error: 'No pending registration found for this email. Please start over.',
                },
                { status: 404 }
            );
        }

        if (new Date() > pending.expiresAt) {
            await db.delete(pendingRegistrations).where(eq(pendingRegistrations.email, email));
            Sentry.captureMessage(
                `Your registration attempt has expired. Please start over.`,
                'warning'
            );
            return NextResponse.json(
                {
                    error: 'Your registration attempt has expired. Please start over.',
                },
                { status: 400 }
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

        const tfoApiUrl = `https://finaloutpost.net/api/v1/creature/${pending.creatureCode}`;
        const response = await fetch(tfoApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiKey': process.env.TFO_API_KEY,
            },
        });
        const tfoData = await response.json();

        if (tfoData.error || !tfoData.code) {
            return NextResponse.json(
                {
                    error: 'Could not fetch the creature from TFO to verify its name. Please try again in a moment.',
                },
                { status: 400 }
            );
        }

        const currentCreatureName = tfoData.name;

        if (currentCreatureName === pending.verificationToken) {
            await db.transaction(async (tx) => {
                await tx.insert(users).values({
                    id: crypto.randomUUID(),
                    email: pending.email,
                    username: pending.tfoUsername,
                    password: pending.hashedPassword,
                });
                await tx.delete(pendingRegistrations).where(eq(pendingRegistrations.email, email));
            });

            Sentry.captureMessage(
                `Account created successfully for email: ${pending.email}`,
                'info'
            );
            return NextResponse.json({
                message: 'Account created successfully! You can now log in.',
            });
        } else {
            Sentry.captureMessage(`Verification failed for email: ${email}`, 'warning');
            return NextResponse.json(
                {
                    error: `Verification failed. The creature's name is currently "${currentCreatureName}", but we expected "${pending.verificationToken}". Please correct the name on TFO and try again.`,
                },
                { status: 400 }
            );
        }
    } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
