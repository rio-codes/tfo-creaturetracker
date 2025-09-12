import { db } from '@/src/db';
import { users, passwordResetTokens } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { hash, compare } from 'bcrypt-ts';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const confirmSchema = z.object({
    token: z.string().min(1, 'Token is required.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function POST(req: Request) {
    Sentry.captureMessage('Confirming password reset', 'log');
    try {
        const body = await req.json();
        const validatedFields = confirmSchema.safeParse(body);

        if (!validatedFields.success) {
            const { fieldErrors } = validatedFields.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            Sentry.captureMessage(
                `Invalid data for resetting password. ${errorMessage}`,
                'warning'
            );
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { token, password } = validatedFields.data;

        const allTokens = await db.select().from(passwordResetTokens);
        let tokenRecord = null;
        for (const record of allTokens) {
            const isMatch = await compare(token, record.token);
            if (isMatch) {
                tokenRecord = record;
                break;
            }
        }

        if (!tokenRecord) {
            Sentry.captureMessage('Invalid or expired token for password reset', 'warning');
            return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });
        }

        if (new Date() > tokenRecord.expires) {
            // Clean up expired token
            await db
                .delete(passwordResetTokens)
                .where(eq(passwordResetTokens.email, tokenRecord.email));
            Sentry.captureMessage('Expired token used for password reset', 'warning');
            return NextResponse.json({ error: 'Token has expired.' }, { status: 400 });
        }

        const newHashedPassword = await hash(password, 12);

        await db
            .update(users)
            .set({ password: newHashedPassword })
            .where(eq(users.email, tokenRecord.email));

        // Delete the token so it can't be used again
        await db
            .delete(passwordResetTokens)
            .where(eq(passwordResetTokens.email, tokenRecord.email));

        Sentry.captureMessage(
            `Password reset successfully for email: ${tokenRecord.email}`,
            'info'
        );
        return NextResponse.json(
            { message: 'Password has been reset successfully.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Password reset confirmation failed:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
