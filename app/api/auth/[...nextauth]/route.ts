import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/src/db';
import { authConfig } from '@/auth';
import type { Adapter } from 'next-auth/adapters';

const { handlers } = NextAuth({
    ...authConfig,
    adapter: DrizzleAdapter(db) as Adapter,
});

export const { GET, POST } = handlers;
