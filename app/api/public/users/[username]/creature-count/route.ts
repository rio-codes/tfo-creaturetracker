import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { creatures, users } from '@/src/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// Schema for query validation
const querySchema = z.object({
    species: z.string().min(1, { message: 'Species parameter is required.' }),
});

// The color you provided for the badge!
const BADGE_COLOR = 'D0BCFF';

export async function GET(req: Request, props: { params: Promise<{ username: string }> }) {
    const params = await props.params;
    try {
        const { username } = params;
        const { searchParams } = new URL(req.url);

        // 1. Validate the 'species' query parameter
        const validation = querySchema.safeParse({
            species: searchParams.get('species'),
        });

        if (!validation.success) {
            return NextResponse.json(
                {
                    schemaVersion: 1,
                    label: 'error',
                    message: 'Invalid species',
                    color: 'red',
                },
                { status: 400 }
            );
        }

        const { species } = validation.data;

        // 2. Find the user by their public username
        const user = await db.query.users.findFirst({
            where: eq(users.username, username),
            columns: { id: true }, // We only need the user's ID
        });

        if (!user) {
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

        // 3. Count the creatures for that user and species
        const result = await db
            .select({ value: count() })
            .from(creatures)
            .where(
                and(eq(creatures.userId, user.id), eq(creatures.species, species))
            );

        const creatureCount = result[0]?.value ?? 0;

        // 4. Return a shields.io-compatible JSON response
        return NextResponse.json({
            schemaVersion: 1,
            label: `${species}s`,
            message: `${creatureCount}`,
            color: BADGE_COLOR,
        });
    } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// Ensure the badge data is always fresh by disabling caching
export const dynamic = 'force-dynamic';

