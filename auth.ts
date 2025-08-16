import NextAuth from 'next-auth'
import { authConfig } from "./auth.config";
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/src/db';
import { users, accounts, sessions, verificationTokens } from '@/src/db/schema';

const authInstance = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
});

export const { auth, signIn, signOut } = authInstance;

export default authInstance;