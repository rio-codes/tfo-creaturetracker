import type { NextAuthConfig } from 'next-auth';
import Credentials from "next-auth/providers/credentials";
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

console.log("AUTH_SECRET loaded:", !!process.env.AUTH_SECRET);

export const authConfig = {
    providers: [
        Credentials({
            credentials: {},
            async authorize(credentials) {
                console.log("we're in authorize")
                if (!credentials?.username || !credentials.password) {
                    return null;
                }

                const user = await db.query.users.findFirst({
                    where: eq(users.username, credentials.username as string),
                });

                if (!user || !user.password) {
                    return null; // User not found or has no password
                }

                const isPasswordValid = await compare(
                    credentials.password as string,
                    user.password
                );

                if (isPasswordValid) {
                    return user;
                }

                return null; // Password was incorrect
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        // The jwt callback is called when a JWT is created or updated.
        async jwt({ token, user }) {
          // On the initial sign-in, the `user` object is passed in.
        if (user) {
        // Add properties from your database user model to the token.
        token.id = user.id;
        token.username = (user as any).username;
        }
        // This token is then encrypted and stored in the user's cookie.
        return token;
    },
    
    // The session callback is called whenever a session is checked.
    session({ session, token }) {
        // The token object contains the data we stored in the `jwt` callback.
        // We add this data to the session object, which is then available on the client.
        // We MUST check if token and session.user exist before modifying.
        if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        }
        // ALWAYS return the session object.
        return session;
    },
    },
    pages: {
        signIn: '/login',
    },
} satisfies NextAuthConfig;