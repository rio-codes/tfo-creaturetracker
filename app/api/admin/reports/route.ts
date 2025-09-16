import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { reports, users } from '@/src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        Sentry.captureMessage('Forbidden access to admin reports', 'log');
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const reporter = alias(users, 'reporter');
        const reported = alias(users, 'reported');

        const allReports = await db
            .select({
                id: reports.id,
                reason: reports.reason,
                status: reports.status,
                createdAt: reports.createdAt,
                reporter: {
                    id: reporter.id,
                    username: reporter.username,
                },
                reported: {
                    id: reported.id,
                    username: reported.username,
                },
            })
            .from(reports)
            .leftJoin(reporter, eq(reports.reporterId, reporter.id))
            .leftJoin(reported, eq(reports.reportedId, reported.id))
            .orderBy(desc(reports.createdAt));

        return NextResponse.json(allReports);
    } catch (error) {
        console.error('Failed to fetch reports:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
