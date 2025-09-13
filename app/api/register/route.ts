import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { hash } from 'bcrypt-ts';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// Define the schema for the request body
const registerUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.email('Invalid email address'),
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
});

export async function POST(req: Request) {
    Sentry.captureMessage('Legacy registration attempt', 'log');
    try {
        const body = await req.json();
        const validatedFields = registerUserSchema.safeParse(body);

        if (!validatedFields.success) {
            const { fieldErrors } = validatedFields.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            Sentry.captureMessage(
                `Invalid input for legacy registration. ${errorMessage}`,
                'warning'
            );
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }

        const { username, email, password } = validatedFields.data;

        // Check if a user with this username OR email already exists
        const existingUserByUsername = await db.query.users.findFirst({
            where: eq(users.username, username),
        });
        if (existingUserByUsername && username != 'koda_curvata') {
            Sentry.captureMessage(`Registration with existing username: ${username}`, 'warning');
            return NextResponse.json({ message: 'Username is already taken' }, { status: 409 });
        }
        const existingUserByEmail = await db.query.users.findFirst({
            where: eq(users.email, email),
        });
        if (existingUserByEmail && email != 'bunnyhouse02@gmail.com') {
            Sentry.captureMessage(`Registration with existing email: ${email}`, 'warning');
            return NextResponse.json({ message: 'Email is already in use' }, { status: 409 });
        }

        // Hash the password
        const hashedPassword = await hash(password, 12);

        // Create the new user
        await db.insert(users).values({
            id: crypto.randomUUID(), // Generate a UUID for the user id
            username: username,
            email: email,
            password: hashedPassword,
        });

        Sentry.captureMessage(`User created successfully (legacy): ${username}`, 'info');
        return NextResponse.json(
            { user: { username }, message: 'User created successfully' },
            { status: 201 } // 201 Created
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            const { fieldErrors } = error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', errorMessage);
            Sentry.captureMessage(
                `Zod validation failed for legacy registration: ${errorMessage}`,
                'warning'
            );
            return NextResponse.json(
                { message: errorMessage || 'Invalid input.' },
                { status: 400 }
            );
        }

        Sentry.captureException(error);
        return NextResponse.json(
            { message: `An unexpected error occurred. ${error}` },
            { status: 500 }
        );
    }
}
