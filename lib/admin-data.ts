import { db } from '@/src/db';
import { auth } from '@/auth';

export async function getAllUsers() {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        // This should ideally not be hit if middleware is correct, but serves as a safeguard.
        throw new Error('Not authorized to fetch user data.');
    }
    // Fetch all users without their passwords for security.
    return db.query.users.findMany({
        columns: { id: true, username: true, email: true, role: true, status: true },
    });
}

export async function getUserById(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        throw new Error('Not authorized to fetch user data.');
    }
    return db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id),
        columns: { id: true, username: true, email: true, role: true, status: true },
    });
}
