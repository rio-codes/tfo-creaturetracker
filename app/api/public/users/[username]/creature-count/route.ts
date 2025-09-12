import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { creatures, users } from '@/src/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// Schema for query validation
const querySchema = z.object({
    species: z.string().min(1, { message: 'Species parameter is required.' }),
    color: z.string().optional(),
});

// The color you provided for the badge!
const BADGE_COLOR = 'D0BCFF';

export async function GET(
    req: Request,
    { params }: { params: { username: string } }
) {
    Sentry.captureMessage(
        `Fetching public creature count for user ${params.username}`,
        'log'
    );
    try {
        const { username } = params;
        const { searchParams } = new URL(req.url);

        const validation = querySchema.safeParse({
            species: searchParams.get('species'),
            color: searchParams.get('color'),
        });

        if (!validation.success) {
            const { fieldErrors } = validation.error.flatten();
            // Since `color` is optional, the only expected validation error is for a missing `species`.
            const errorMessage =
                fieldErrors.species?.join(' ') ??
                'Invalid or missing species parameter.';

            console.error('Zod Validation Failed:', fieldErrors);
            Sentry.captureMessage(
                `Invalid parameter for public creature count: ${errorMessage}`,
                'warning'
            );
            return NextResponse.json(
                {
                    schemaVersion: 1,
                    label: 'error',
                    message: errorMessage,
                    color: 'red',
                },
                { status: 400 }
            );
        }

        const { species, color } = validation.data;

        const user = await db.query.users.findFirst({
            where: eq(users.username, username),
            columns: { id: true }, // We only need the user's ID
        });

        if (!user) {
            Sentry.captureMessage(
                `User not found for public creature count: ${username}`,
                'warning'
            );
            return NextResponse.json(
                {
                    schemaVersion: 1,
                    label: 'error',
                    message: 'User not found',
                    color: 'red',
                },
                { status: 404 }
            );
        }

        const result = await db
            .select({ value: count() })
            .from(creatures)
            .where(
                and(eq(creatures.userId, user.id), eq(creatures.species, species))
            );

        const creatureCount = result[0]?.value ?? 0;

        Sentry.captureMessage(
            `Successfully fetched public creature count for ${username}`,
            'info'
        );
        return NextResponse.json({
            schemaVersion: 1,
            label: `${species}s`,
            message: `${creatureCount}`,
            color: color || BADGE_COLOR,
        });
    } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// Ensure the badge data is always fresh by disabling caching
export const dynamic = 'force-dynamic';
