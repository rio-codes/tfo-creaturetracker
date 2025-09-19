import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { z } from 'zod';
import { hasObscenity } from '@/lib/obscenity';
import { reports } from '@/src/db/schema';

const reportSchema = z.object({
    reportedUserId: z.string().uuid(),
    reason: z
        .string()
        .min(10, 'Reason must be at least 10 characters.')
        .max(1000, 'Reason cannot exceed 1000 characters.'),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const reporterId = session.user.id;

    try {
        const body = await req.json();
        const validated = reportSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { reportedUserId, reason } = validated.data;

        if (reporterId === reportedUserId) {
            return NextResponse.json({ error: 'You cannot report yourself.' }, { status: 400 });
        }

        if (hasObscenity(reason)) {
            return NextResponse.json(
                { error: 'Your report contains inappropriate language. Please revise it.' },
                { status: 400 }
            );
        }

        await db.insert(reports).values({ reporterId, reportedId: reportedUserId, reason });

        return NextResponse.json(
            { message: 'Report submitted successfully. Thank you.' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Failed to submit report:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
