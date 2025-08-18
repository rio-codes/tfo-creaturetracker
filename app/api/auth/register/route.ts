import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

// Define the schema for the request body
const registerUserSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    email: z.email("Invalid email address"),
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
        const { username, email, password } = registerUserSchema.parse(body);

        // Check if a user with this username OR email already exists
        const existingUserByUsername = await db.query.users.findFirst({
            where: eq(users.username, username),
        });
        if (existingUserByUsername) {
            return NextResponse.json(
                { message: "Username is already taken" }, { status: 409 }
            );
        }
        const existingUserByEmail = await db.query.users.findFirst({
            where: eq(users.email, email),
        });
        if (existingUserByEmail) {
            return NextResponse.json(
                { message: "Email is already in use" }, { status: 409 }
            );
        }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create the new user
    await db.insert(users).values({
        id: crypto.randomUUID(), // Generate a UUID for the user id
        username: username,
        email: email,
        password: hashedPassword,
    });

    return NextResponse.json(
        { user: { username }, message: "User created successfully" },
        { status: 201 } // 201 Created
    );
    } catch (error) {
        if (error instanceof z.ZodError) {
            // console.error("Zod Validation Failed:", error.flatten().fieldErrors);
            return NextResponse.json(
                { message: error.flatten().fieldErrors },
                { status: 400 }
            );
        }
            
        // console.error("Registration Error:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred." },
            { status: 500 }
        );
    }
}