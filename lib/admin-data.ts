import { db } from '@/src/db';
import { auth } from '@/auth';
import { users as _users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function getAllUsers() {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        // This should ideally not be hit if middleware is correct, but serves as a safeguard.
        throw new Error('Not authorized to fetch user data.');
    }
    // Fetch all users without their passwords for security.
    return db
        .select({ id: _users.id, username: _users.username, email: _users.email, role: _users.role, status: _users.status })
        .from(_users);
}

export async function getUserById(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        throw new Error('Not authorized to fetch user data.');
    }
    const user = await db
        .select({ id: _users.id, username: _users.username, email: _users.email, role: _users.role, status: _users.status })
        .from(_users)
        .where(eq(_users.id, id))
        .limit(1);
    return user[0] || null;
}
