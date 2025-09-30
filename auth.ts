/* eslint-disable no-useless-catch */
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/src/db';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcrypt-ts';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import type { DbUser } from '@/types';

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db),
    session: {
        strategy: 'jwt',
    },
    providers: [
        Credentials({
            credentials: {
                username: { label: 'Username' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(c) {
                const username = c.username as string | undefined;
                const password = c.password as string | undefined;

                if (!username || !password) {
                    return null;
                }

                try {
                    const user: DbUser | undefined = await db.query.users.findFirst({
                        where: eq(users.username, username),
                    });

                    if (!user) {
                        throw new Error('No user found with that username.');
                    }
                    if (user.status === 'suspended') {
                        throw new Error('This account has been suspended.');
                    }
                    if (!user.password) {
                        throw new Error('Account not set up for password login.');
                    }

                    const isPasswordValid = await compare(password, user.password);
                    if (isPasswordValid) {
                        const { password, ...userWithoutPassword } = user;
                        return userWithoutPassword;
                    } else {
                        throw new Error('Invalid username or password.');
                    }
                } catch (error) {
                    // Re-throw the error to be handled by Auth.js
                    throw error;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // 1. Initial sign in: `user` object is passed.
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.username = user.username;
                token.theme = user.theme;
                token.image = user.image;
            }

            // 2. Session update (e.g., avatar change)
            if (trigger === 'update' && session) {
                token = { ...token, ...session };
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as 'user' | 'admin';
                session.user.username = token.username as string;
                session.user.theme = token.theme as 'light' | 'dark' | 'system';
                session.user.image = token.image as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
});
