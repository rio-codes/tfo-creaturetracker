import { db } from '@/src/db';
import { researchGoals } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

async function getPlaceholderImage(baseUrl: string): Promise<Response> {
    const placeholderUrl = new URL('/placeholder.png', baseUrl).toString();
    const response = await fetch(placeholderUrl);
    // Re-create the response to ensure headers are correctly set for the client
    return new Response(response.body, {
        headers: { 'Content-Type': response.headers.get('Content-Type') || 'image/png' },
    });
}

export async function GET(req: Request, { params }: { params: { goalId: string } }) {
    const goalId = params.goalId;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tfo.creaturetracker.net';

    try {
        const goal = await db.query.researchGoals.findFirst({
            where: eq(researchGoals.id, goalId),
            columns: { imageUrl: true },
        });

        let imageUrl = goal?.imageUrl;

        if (!imageUrl) {
            // If no goal or no image URL, serve the placeholder.
            return await getPlaceholderImage(baseUrl);
        }

        if (!imageUrl.startsWith('http')) {
            imageUrl = new URL(imageUrl, baseUrl).toString();
        }

        // Fetch the creature's image and stream it back directly.
        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
            // If fetching the creature's image fails, log it and return the placeholder.
            const errorMsg = `Failed to fetch goal image from ${imageUrl}. Status: ${imageResponse.status}`;
            console.error(errorMsg);
            Sentry.captureMessage(errorMsg);
            return await getPlaceholderImage(baseUrl);
        }

        // Return the fetched image.
        return new Response(imageResponse.body, {
            headers: { 'Content-Type': imageResponse.headers.get('Content-Type') || 'image/png' },
        });
    } catch (e: any) {
        Sentry.captureException(e);
        console.error(`Failed to generate image for goal ${goalId}:`, e);
        // As a final fallback, return the placeholder image.
        return await getPlaceholderImage(baseUrl);
    }
}
