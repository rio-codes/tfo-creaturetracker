// app/api/auth/register/route.ts

import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

// Define the schema for the request body
const registerUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(12, { 
            message: "Password must be at least 12 characters long" 
        })
        .regex(/[a-zA-Z]/, { 
            message: 'Password must contain at least one letter.' 
        })
        .regex(/[0-9]/, { 
            message: 'Password must contain at least one number.' 
        })
        .regex(/[^a-zA-Z0-9]/, {
            message: 'Password must contain at least one special character.',
        })
        .trim(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = registerUserSchema.parse(body);

        // Check if user with this email already exists
        const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
        });

        if (existingUser) {
        return NextResponse.json(
            { user: null, message: "User with this email already exists" },
            { status: 409 } // 409 Conflict
        );
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create the new user
    await db.insert(users).values({
      id: crypto.randomUUID(), // Generate a UUID for the user id
        email: email,
        password: hashedPassword,
    });

    return NextResponse.json(
        { user: { email }, message: "User created successfully" },
      { status: 201 } // 201 Created
    );
    } catch (error) {
        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
        return NextResponse.json(
            { message: "Invalid request data", errors: error.errors },
            { status: 400 }
        );
        }
        
        return NextResponse.json(
            { message: "An unexpected error occurred." },
            { status: 500 }
        );
    }
}