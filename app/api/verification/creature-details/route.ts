import { NextResponse } from 'next/server';
import { z } from 'zod';

const creatureSchema = z.object({
    creatureCode: z.string().min(1, 'Creature code is required.'),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validated = creatureSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: 'Invalid input.' },
                { status: 400 }
            );
        }
        const { creatureCode } = validated.data;

        const tfoApiUrl = `https://finaloutpost.net/api/v1/creature/${creatureCode}`;
        const response = await fetch(tfoApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json', // This is fine
                apiKey: process.env.TFO_API_KEY as string, // Cast to string
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch creature details from TFO API.');
        }

        const data = await response.json();

        if (data.error || !data.imgsrc) {
            console.log(data);
            return NextResponse.json(
                { error: 'Could not find creature image from TFO.' },
                { status: 404 }
            );
        }

        return NextResponse.json({ imageUrl: data.imgsrc });
    } catch (error: any) {
        console.error('Fetch creature details failed:', error);
        return NextResponse.json(
            { error: error.message || 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
