import { ImageResponse } from 'next/og';
import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

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
        return new Response('Goal not found', { status: 404 });
    }

    const altText = `An image of the creature for the TFO research goal: ${goal.name}.`;

    let imageUrl = goal.imageUrl;
    if (!imageUrl) {
        // Using an absolute URL for the placeholder is safer for OG images.
        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        imageUrl = new URL('/placeholder.png', baseUrl).toString();
    }

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    backgroundColor: '#f0eafc', // barely-lilac
                    color: '#3C2D63', // pompaca-purple
                    fontFamily: '"Tektur"',
                }}
            >
                <img
                    src={imageUrl}
                    alt={altText}
                    width="400"
                    height="400"
                    style={{ objectFit: 'contain', borderRadius: '10px' }}
                />
                <h1
                    style={{ fontSize: 60, marginTop: 20, textAlign: 'center' }}
                >
                    {goal.name}
                </h1>
                <p style={{ fontSize: 30, textAlign: 'center' }}>
                    Species: {goal.species}
                </p>
                <p
                    style={{
                        fontSize: 24,
                        position: 'absolute',
                        bottom: 20,
                        right: 40,
                    }}
                >
                    tfo.creaturetracker
                </p>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
