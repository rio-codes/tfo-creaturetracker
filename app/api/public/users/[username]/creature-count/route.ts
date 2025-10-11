import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { creatures, users } from '@/src/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { z } from 'zod';


const querySchema = z.object({
    species: z.string().min(1, { message: 'Species parameter is required.' }),
    color: z.string().optional().nullable(),
});

const BADGE_COLOR = 'D0BCFF';

export async function GET(req: Request, props: { params: Promise<{ username: string }> }) {
    const params = await props.params;
    try {
        const { username } = params;
        const { searchParams } = new URL(req.url);

        const validation = querySchema.safeParse({
            species: searchParams.get('species'),
            color: searchParams.get('color'),
        });

        if (!validation.success) {
            const errorMessage =
                validation.error.flatten().fieldErrors.species?.join(' ') ??
                'Invalid or missing species parameter.';

            console.error('Zod Validation Failed in creature-count badge', {
                error: validation.error.flatten().fieldErrors,
            });
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
            columns: { id: true },
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

        const result = await db
            .select({ value: count() })
            .from(creatures)
            .where(
                and(eq(creatures.userId, user.id), eq(creatures.species, species))
            );

        const creatureCount = result[0]?.value ?? 0;

        return NextResponse.json({
            schemaVersion: 1,
            label: `${species}s`,
            message: `${creatureCount}`,
            color: color ?? BADGE_COLOR,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// Ensure the badge data is always fresh by disabling caching
export const dynamic = 'force-dynamic';
