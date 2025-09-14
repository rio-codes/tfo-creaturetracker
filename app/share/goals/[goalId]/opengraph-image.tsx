import { ImageResponse } from 'next/og';
import { db } from '@/src/db';
import { researchGoals, users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export const alt = 'TFO Creature Tracker Research Goal';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { goalId: string } }) {
    const goalId = params.goalId;

    try {
        const goal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, goalId),
        });

        if (!goal) {
            return new ImageResponse(
                (
                    <div
                        style={{
                            fontSize: 48,
                            background: '#D0BCFF',
                            color: '#3C2D63',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        Goal Not Found
                    </div>
                ),
                { ...size }
            );
        }

        const username = await db.query.users.findFirst({
            where: eq(users.id, goal.userId),
            columns: { username: true },
        });

        const altText = `TFO research goal created by ${username?.username}: ${goal.name}.`;

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tfo.creaturetracker.net';
        let imageUrl = goal.imageUrl;
        if (!imageUrl) {
            imageUrl = new URL('/placeholder.png', baseUrl).toString();
        } else if (!imageUrl.startsWith('http')) {
            imageUrl = new URL(imageUrl, baseUrl).toString();
        }

        // Fetch font and image data concurrently.
        // This ensures all network I/O is handled within the try/catch block.
        const fontUrl = new URL('/fonts/Tektur-Regular.ttf', baseUrl).toString();

        const [imageResponse, fontResponse] = await Promise.all([fetch(imageUrl), fetch(fontUrl)]);

        if (!imageResponse.ok) {
            throw new Error(
                `Failed to fetch image from ${imageUrl}. Status: ${imageResponse.status}`
            );
        }
        if (!fontResponse.ok) {
            throw new Error(`Failed to fetch font from ${fontUrl}. Status: ${fontResponse.status}`);
        }

        const [imageBuffer, fontData] = await Promise.all([
            imageResponse.arrayBuffer(),
            fontResponse.arrayBuffer(),
        ]);

        // Convert image to a data URI
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const imageSrc = `data:${imageResponse.headers.get('content-type')};base64,${imageBase64}`;

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
                        fontFamily: 'Tektur',
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
                            src={imageSrc}
                            alt={altText}
                            width="400"
                            height="400"
                            style={{ objectFit: 'contain', borderRadius: '10px' }}
                        />
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                marginLeft: '40px',
                                maxWidth: '600px',
                            }}
                        >
                            <h1 style={{ fontSize: 60, textAlign: 'left', lineHeight: '1.2' }}>
                                {goal.name}
                            </h1>
                            {goal.species && (
                                <p style={{ fontSize: 30, textAlign: 'left', marginTop: '10px' }}>
                                    Species: {goal.species}
                                </p>
                            )}
                            {username && (
                                <div
                                    style={{
                                        fontSize: 30,
                                        textAlign: 'left',
                                        marginTop: '20px',
                                        color: '#6B4FBB',
                                    }}
                                >
                                    Created by: {username?.username}
                                </div>
                            )}
                        </div>
                    </div>
                    <p
                        style={{
                            fontSize: 24,
                            position: 'absolute',
                            bottom: 20,
                            right: 40,
                            color: '#6B4FBB',
                        }}
                    >
                        tfo.creaturetracker.net
                    </p>
                </div>
            ),
            {
                ...size,
                fonts: [
                    {
                        name: 'Tektur',
                        data: fontData,
                        style: 'normal',
                        weight: 400,
                    },
                ],
            }
        );
    } catch (e: any) {
        console.error(`Failed to generate image for goal ${goalId}:`, e);
        return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
    }
}
