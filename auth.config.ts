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
                if (!credentials?.username || !credentials.password) {
                    console.log("[Authorize] Missing username or password.");
                    return null;
                }
                
                try {
                    console.log(`[Authorize] Searching for user: ${credentials.username}`);
                    const user = await db.query.users.findFirst({
                        where: eq(users.username, credentials.username as string),
                    });
                    if (!user) {
                        console.log("[Authorize] User not found in database.");
                        return null;
                    }
                    if (!user.password) {
                        console.log("[Authorize] User found, but they do not have a password set.");
                        return null;
                    }
                    const isPasswordValid = await compare(
                        credentials.password as string,
                        user.password
                    );
                    if (isPasswordValid) {
                        console.log("[Authorize] Success! Returning user.");
                        return user;
                    } else {
                        console.log("[Authorize] Password comparison failed.");
                        return null;
                    }
                } catch (error) {
                    console.error("[Authorize] An unexpected error occurred:", error);
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