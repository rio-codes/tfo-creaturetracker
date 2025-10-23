import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { checkForInbreeding } from '@/lib/breeding-rules';

const inbreedingCheckSchema = z.object({
    maleKey: z.object({
        userId: z.string(),
        code: z.string(),
    }),
    femaleKey: z.object({
        userId: z.string(),
        code: z.string(),
    }),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = inbreedingCheckSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const { maleKey, femaleKey } = validated.data;

        // This function now runs safely on the server
        const isInbred = await checkForInbreeding(maleKey, femaleKey);

        return NextResponse.json({ isInbred });
    } catch (error) {
        console.error('Failed to check for inbreeding:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
