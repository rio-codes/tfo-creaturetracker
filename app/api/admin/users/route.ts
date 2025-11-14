import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { and, ilike, or, eq, desc, count, SQL } from 'drizzle-orm';

export async function GET(req: Request) {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const query = searchParams.get('query');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    const whereConditions: (SQL | undefined)[] = [
        query
            ? or(ilike(users.username, `%${query}%`), ilike(users.email, `%${query}%`))
            : undefined,
        role ? eq(users.role, role as any) : undefined,
        status ? eq(users.status, status as any) : undefined,
    ].filter(Boolean);

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    try {
        const userList = await db.query.users.findMany({
            where,
            orderBy: [desc(users.createdAt)],
            limit,
            offset,
            columns: {
                password: false,
                supporterTier: true,
            },
        });

        const totalCountResult = await db.select({ count: count() }).from(users).where(where);
        const totalUsers = totalCountResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalUsers / limit);

        return NextResponse.json({
            users: userList,
            pagination: {
                totalUsers,
                totalPages,
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
