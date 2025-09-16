import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users, creatures, breedingPairs, researchGoals } from '@/src/db/schema';
import { count, gte } from 'drizzle-orm';
import { subDays } from 'date-fns';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
    Sentry.captureMessage('Admin: fetching metrics', 'log');
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'admin') {
        Sentry.captureMessage('Forbidden access to admin metrics', 'log');
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const [totalUsers, newUsersLastWeek, totalCreatures, totalPairs, totalGoals] =
            await Promise.all([
                db.select({ value: count() }).from(users),
                db
                    .select({ value: count() })
                    .from(users)
                    .where(gte(users.createdAt, subDays(new Date(), 7))),
                db.select({ value: count() }).from(creatures),
                db.select({ value: count() }).from(breedingPairs),
                db.select({ value: count() }).from(researchGoals),
            ]);

        Sentry.captureMessage('Admin: successfully fetched metrics', 'info');
        return NextResponse.json({
            totalUsers: totalUsers[0].value,
            newUsersLastWeek: newUsersLastWeek[0].value,
            totalCreatures: totalCreatures[0].value,
            totalPairs: totalPairs[0].value,
            totalGoals: totalGoals[0].value,
        });
    } catch (error) {
        console.error('Failed to fetch admin metrics:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
}
