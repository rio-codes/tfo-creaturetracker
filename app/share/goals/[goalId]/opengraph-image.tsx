import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { db } from '@/src/db';
import { researchGoals, users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { goalId: string } }) {
    const goalId = params.goalId;
    const goal = await db.query.researchGoals.findFirst({
        where: eq(researchGoals.id, goalId),
    });

    if (!goal) {
        return new Response('Goal not found', { status: 404 });
    }

    const username = await db.query.users.findFirst({
        where: eq(users.id, goal.userId),
        columns: { username: true },
    });

    const altText = `TFO research goal created by ${username?.username}: ${goal.name}.`;

    const tekturRegular = readFile(join(process.cwd(), 'assets/fonts/Tektur-Regular.ttf'));

    let imageUrl = goal.imageUrl;
    if (!imageUrl || !imageUrl.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tfo.creaturetracker.net';
        imageUrl = new URL('/placeholder.png', baseUrl).toString();
    }

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    background: '#D0BCFF',
                    color: '#3C2D63',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexGrow: 1,
                        padding: '20px',
                    }}
                >
                    <img
                        src={imageUrl}
                        alt={altText}
                        width="400"
                        height="400"
                        style={{
                            objectFit: 'contain',
                        }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            marginLeft: '40px',
                            maxWidth: '600px',
                        }}
                    >
                        <h1
                            style={{
                                fontSize: 60,
                                textAlign: 'left',
                                lineHeight: '1.2',
                            }}
                        >
                            {goal.name}
                        </h1>
                        {goal.species && (
                            <p
                                style={{
                                    fontSize: 30,
                                    textAlign: 'left',
                                    marginTop: '10px',
                                }}
                            >
                                Species: {goal.species}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'Tektur',
                    data: await tekturRegular,
                    style: 'normal',
                    weight: 400,
                },
            ],
        }
    );
}
