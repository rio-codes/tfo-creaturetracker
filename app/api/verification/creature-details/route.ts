import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const creatureSchema = z.object({
    creatureCode: z.string().min(1, 'Creature code is required.'),
});

export async function POST(req: Request) {
    try {
        Sentry.captureMessage('Fetching creature details for verification', 'log');
        const body = await req.json();
        const validated = creatureSchema.safeParse(body);

        if (!validated.success) {
            const { fieldErrors } = validated.error.flatten();
            const errorMessage = Object.values(fieldErrors)
                .flatMap((errors) => errors)
                .join(' ');
            console.error('Zod Validation Failed:', fieldErrors);
            Sentry.captureMessage(`Invalid data for creating pair. ${errorMessage}`, 'warning');
            return NextResponse.json({ error: errorMessage || 'Invalid input.' }, { status: 400 });
        }
        const { creatureCode } = validated.data;

        if (!process.env.TFO_API_KEY) {
            console.error('TFO_API_KEY is not set.');
            Sentry.captureException(new Error('TFO_API_KEY is not set.'));
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        const tfoApiUrl = `https://finaloutpost.net/api/v1/creature/${creatureCode}`;
        const response = await fetch(tfoApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiKey': process.env.TFO_API_KEY,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch creature details from TFO API.');
        }

        const data = await response.json();

        if (data.error || !data.imgsrc) {
            console.log(data);
            Sentry.captureMessage(
                `Could not find creature image from TFO for verification: ${creatureCode}`,
                'warning'
            );
            return NextResponse.json(
                { error: 'Could not find creature image from TFO.' },
                { status: 404 }
            );
        }

        Sentry.captureMessage(
            `Successfully fetched creature details for verification: ${creatureCode}`,
            'info'
        );
        return NextResponse.json({ imageUrl: data.imgsrc });
    } catch (error: any) {
        console.error('Fetch creature details failed:', error);
        Sentry.captureException(error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
