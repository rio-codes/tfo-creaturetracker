import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials"
import { db } from "@/src/db"
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

export default NextAuth({
    providers: [
        Credentials({
            credentials: {
                username: {},
                password: {},
            },
            // authorize function to check credentials
            async authorize(credentials) {
                // check if email and password are entered
                if (!credentials?.username || !credentials.password) {
                    return null;
                }
                // look up user in db
                const user = await db.query.users.findFirst({
                    where: eq(users.username, credentials.username as string),
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
    callbacks: {
        session({ session, token, user }) {
            return session
        },
    },
})
