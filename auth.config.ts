import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { db } from "@/src/db"
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

// Notice this is typed as NextAuthConfig
export default {
    providers: [
        Credentials({
            credentials: {
            email: {},
            password: {},
            },
            // authorize function to check credentials
            async authorize(credentials) {
                // check if email and password are entered
                if (!credentials?.email || !credentials.password) {
                    return null;
                }
                // look up user in db
                const user = await db.query.users.findFirst({
                    where: eq(users.email, credentials.email as string),
                });
                if (!user || !user.password) {
                    return null;
                }
                // function to check password
                const isPasswordValid = await compare(
                    credentials.password as string,
                    user.password
                );
                // return user to log them in if password is valid
                if (isPasswordValid) {
                    return user;
                }
                return null;
                },
            }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        session({ session, token }) {
        if (session.user && token.sub) {
            session.user.id = token.sub;
        }
        return session;
        }
    },
    pages: {
        signIn: '/login',
    }
} satisfies NextAuthConfig;