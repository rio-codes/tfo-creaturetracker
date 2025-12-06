import NextAuth from 'next-auth';
import { authConfig } from '@/auth';

const { handlers } = NextAuth({
    ...authConfig
});

export const { GET, POST } = handlers;
