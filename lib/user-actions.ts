import 'server-only';
import { db } from '@/src/db';
import { userActionLog } from '@/src/db/schema';
import { auth } from '@/auth';

type UserActionLogPayload = {
    action: string; // e.g. 'goal.create'
    description: string; // e.g. 'Created research goal "My Shiny Goal"'
    link?: string; // e.g. '/research-goals/some-id'
};

export async function logUserAction(payload: UserActionLogPayload) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        console.warn('Attempted to log a user action without a session.');
        return;
    }

    await db.insert(userActionLog).values({
        userId,
        ...payload,
    });
}
