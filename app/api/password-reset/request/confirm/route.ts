import { db } from "@/src/db";
import { users, passwordResetTokens } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { z } from "zod";

const confirmSchema = z.object({
    token: z.string().min(1, "Token is required."),
    password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = confirmSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid input." },
                { status: 400 }
            );
        }

        const { token, password } = result.data;

        const allTokens = await db.select().from(passwordResetTokens);
        let tokenRecord = null;
        for (const record of allTokens) {
            const isMatch = await compare(token, record.token);
            if (isMatch) {
                tokenRecord = record;
                break;
            }
        }

        if (!tokenRecord) {
            return NextResponse.json(
                { error: "Invalid or expired token." },
                { status: 400 }
            );
        }

        if (new Date() > tokenRecord.expires) {
            // Clean up expired token
            await db
                .delete(passwordResetTokens)
                .where(eq(passwordResetTokens.email, tokenRecord.email));
            return NextResponse.json(
                { error: "Token has expired." },
                { status: 400 }
            );
        }

        const newHashedPassword = await hash(password, 12);

        await db
            .update(users)
            .set({ password: newHashedPassword })
            .where(eq(users.email, tokenRecord.email));

        // Delete the token so it can't be used again
        await db
            .delete(passwordResetTokens)
            .where(eq(passwordResetTokens.email, tokenRecord.email));

        return NextResponse.json(
            { message: "Password has been reset successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Password reset confirmation failed:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
