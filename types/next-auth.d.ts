import type { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: 'user' | 'admin';
            username: string;
            theme: string;
        } & DefaultSession['user'];
    }

    interface User extends DefaultUser {
        role: 'user' | 'admin';
        username: string;
        theme: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: 'user' | 'admin';
    }
}
