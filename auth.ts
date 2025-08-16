import "next-auth/jwt"
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/src/db';
import { users, accounts, sessions, verificationTokens } from '@/src/db/schema';
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { NextResponse } from 'next/server';
import { authConfig } from "./auth.config";

export async function GET(request) {
  // Access query parameters
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id'); 

  // Perform data fetching or other GET-related logic
  const data = { message: `Hello from GET handler! ID: ${id}` };

  return NextResponse.json(data);
}

export async function POST(request) {
  // Access the request body (e.g., JSON data)
  const body = await request.json(); 

  // Perform data processing or other POST-related logic
  const responseData = { received: body, status: 'success' };

  return NextResponse.json(responseData);
}

export const {
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(
    db, 
    {    
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
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
});

declare module "next-auth" {
  interface Session {
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
  }
}