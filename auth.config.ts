import type { NextAuthConfig } from 'next-auth';
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { db } from '@/src/db';
import { users } from '@/src/db/schema';

export const authConfig: NextAuthConfig = {
    providers: [
            Credentials({
                credentials: {
                    username: {},
                    password: {},
                },
        
                // authorize function to check credentials
                async authorize(credentials) {
                    console.log("[Authorize] Attempting to authorize user:", credentials?.username);

                    if (!credentials?.username || !credentials.password) {
                    console.error("[Authorize] Missing username or password.");
                    return null;
                    }

                    try {
                    const user = await db.query.users.findFirst({
                        where: eq(users.username, credentials.username as string),
                    });

                    if (!user || !user.password) {
                        console.warn("[Authorize] User not found or user has no password:", credentials.username);
                        return null;
                    }

                    const isPasswordValid = await compare(
                        credentials.password as string,
                        user.password
                    );

                    if (isPasswordValid) {
                        console.log("[Authorize] Password valid. Returning user object:", { id: user.id, email: user.email });
                        return user; // Return the full user object on success
                    } else {
                        console.warn("[Authorize] Invalid password for user:", credentials.username);
                        return null;
                    }
                    } catch (error) {
                    console.error("[Authorize] An unexpected error occurred:", error);

                    return null;
                    }
                },
            }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            console.log("User object passed to JWT callback:", user);
            if (user) {
                token.id = user.id;
                token.username = (user as any).username; 
            }
            return token;
        },
        session({ session, token }) {
            console.log("Token object passed to Session callback:", token);
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
            }
            console.log("Session object being returned:", session);
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    events: {
        async signIn(message) {
            console.log(JSON.stringify({
                message: "Successful sign-in",
                level: "info",
                context: {
                    timestamp: new Date().toISOString(),
                    user: message.user,
                    account: message.account,
                    isNewUser: message.isNewUser
                }
            }));
        },
        async signOut(message) { 
            console.log(JSON.stringify({
                message: "Successful sign-out",
                level: "info",
                context: {
                    timestamp: new Date().toISOString(),
                    token: message.token
                }
            }));
        },
        async createUser(message) {
            var logMessage = ""
            if (message.user.name) {
                logMessage = "Created new user: ".concat((message.user.name).toString())
            }
            else {
                logMessage = "Created new user but name was not stored."
            }
            console.log(JSON.stringify({
                message: logMessage,
                level: "info",
                context: {
                    timestamp: new Date().toISOString(),
                    user: message.user.name
                }
            }));
        }
    }
} satisfies NextAuthConfig
    