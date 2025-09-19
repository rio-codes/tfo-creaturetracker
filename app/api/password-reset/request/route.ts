import { db } from '@/src/db';
import { users, passwordResetTokens } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { hash } from 'bcrypt-ts';
import { sendPasswordResetEmail } from '@/lib/mail';
import { track } from '@vercel/analytics/server';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const hashedToken = await hash(token, 12);
            const expires = new Date(new Date().getTime() + 3600 * 1000);

            await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));

            // Insert the new token
            await db.insert(passwordResetTokens).values({
                email: email,
                token: hashedToken,
                expires: expires,
            });

            // Send the email with the RAW, un-hashed token
            await sendPasswordResetEmail(email, token);
            track('password_reset_request', { email });
        } else {
            track('password_reset_request_nonexistent', { email });
        }

        return NextResponse.json(
            {
                message:
                    'If an account with that email exists, a password reset link has been sent.',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Password reset request failed:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
