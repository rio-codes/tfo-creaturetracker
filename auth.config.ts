import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import type { User as DbUser } from '@/types';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import * as Sentry from '@sentry/nextjs';

export const authConfig = {
    providers: [
        Credentials({
            credentials: {},
            async authorize(c) {
                const credentials = c as {
                    username?: string;
                    password?: string;
                }; // Cast to a more specific type
                if (!credentials.username || !credentials.password) {
                    return null;
                }

                try {
                    const user = (await db.query.users.findFirst({
                        where: eq(users.username, credentials.username),
                    })) as unknown as DbUser | undefined;
                    if (!user) {
                        return null;
                    }
                    if (user.status === 'suspended') {
                        // User is suspended, deny login.
                        return null;
                    }
                    if (!('password' in user) || !user.password) {
                        return null;
                    }
                    const isPasswordValid = await compare(
                        credentials.password,
                        user.password as string
                    );
                    if (isPasswordValid) {
                        return user;
                    } else {
                        return null;
                    }
                } catch (error) {
                    Sentry.captureException(error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        // The jwt callback is called when a JWT is created or updated.
        async jwt({ token, user }) {
            if (user) {
                // Add properties from your database user model to the token.
                token.id = user.id;
                token.username = user.username;
                token.role = user.role;
                token.theme = user.theme;
            }

            // This token is then encrypted and stored in the user's cookie.
            return token;
        },

        // The session callback is called whenever a session is checked.
        session({ session, token }) {
            // The token object contains the data we stored in the `jwt` callback.
            if (token && session.user) {
                session.user.id = token.id;
                session.user.username = token.username;
                session.user.role = token.role;
                session.user.theme = token.theme;
            }
            // ALWAYS return the session object.
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
} satisfies NextAuthConfig;
