import 'server-only';

import { db } from '@/src/db';
import { userActionLog } from '@/src/db/schema';
import { auth } from '@/auth';
import { eq, desc } from 'drizzle-orm';

export async function getUserActionLog() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return [];
    }

    const logs = await db.query.userActionLog.findMany({
        where: eq(userActionLog.userId, userId),
        orderBy: [desc(userActionLog.timestamp)],
        limit: 100, // Paginate later if needed
    });

    return logs;
}
