import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { users, researchGoals } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

const session = await auth();
const userId = session?.user?.id;
const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

export const alt = `A TFO Research Goal generated for you by ${user.username || 'a tfo.creaturetracker user'}`;

export default async function Image({
    params,
}: {
    params: { goalId: string };
}) {
    const goalId = params.goalId;
    const goal = await db.query.researchGoals.findFirst({
        where: eq(researchGoals.id, goalId),
    });

    if (!goal) {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const imageUrl = goal.imageUrl;
    if (!imageUrl) {
        return NextResponse.json(
            { error: 'Image URL not found' },
            { status: 404 }
        );
    }

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <img src={imageUrl} alt={alt} height="100" />
            </div>
        )
    );
}
