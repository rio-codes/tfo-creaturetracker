import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/src/db';
import { users, accounts, sessions, verificationTokens } from '@/src/db/schema';
import { authConfig } from './auth.config';

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