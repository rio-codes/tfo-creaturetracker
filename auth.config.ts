import type { NextAuthConfig } from 'next-auth';
import Credentials from "next-auth/providers/credentials";
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import * as Sentry from "@sentry/nextjs";

export const authConfig = {
    providers: [
        Credentials({
            credentials: {},
            async authorize(credentials) {
                if (!credentials?.username || !credentials.password) {
                    return null;
                }
                
                try {
                    const user = await db.query.users.findFirst({
                        where: eq(users.username, credentials.username as string),
                    });
                    if (!user) {
                        return null;
                    }
                    if (!user.password) {
                        return null;
                    }
                    const isPasswordValid = await compare(
                        credentials.password as string,
                        user.password
                    );
                    if (isPasswordValid) {
                        return user;
                    } else {;
                        return null;
                    }
                } catch (error) {
                    Sentry.captureException(error);
                    return null;
                }
            }
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        // The jwt callback is called when a JWT is created or updated.
        async jwt({ token, user }) {
            if (user) {
                // Add properties from your database user model to the token.
                token.id = user.id;
                token.username = (user as any).username;
                token.role = (user as any).role;
            }
            // This token is then encrypted and stored in the user's cookie.
            return token;
        },

        // The session callback is called whenever a session is checked.
        session({ session, token }) {
            // The token object contains the data we stored in the `jwt` callback.
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.role = token.role as string;
            }
            // ALWAYS return the session object.
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
} satisfies NextAuthConfig;