import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import {
    users,
    creatures,
    breedingPairs,
    researchGoals,
} from '@/src/db/schema';
import { count, gte } from 'drizzle-orm';
import { subDays } from 'date-fns';

export async function GET() {
    const session = await auth();
    // @ts-expect-error session will be typed correctly in a later update
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const [
            totalUsers,
            newUsersLastWeek,
            totalCreatures,
            totalPairs,
            totalGoals,
        ] = await Promise.all([
            db.select({ value: count() }).from(users),
            db
                .select({ value: count() })
                .from(users)
                .where(gte(users.createdAt, subDays(new Date(), 7))),
            db.select({ value: count() }).from(creatures),
            db.select({ value: count() }).from(breedingPairs),
            db.select({ value: count() }).from(researchGoals),
        ]);

        return NextResponse.json({
            totalUsers: totalUsers[0].value,
            newUsersLastWeek: newUsersLastWeek[0].value,
            totalCreatures: totalCreatures[0].value,
            totalPairs: totalPairs[0].value,
            totalGoals: totalGoals[0].value,
        });
    } catch (error) {
        console.error('Failed to fetch admin metrics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metrics' },
            { status: 500 }
        );
    }
}
