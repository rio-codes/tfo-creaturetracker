import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { accountVerifications } from "@/src/db/schema";
import crypto from "crypto";
import { z } from "zod";

const startSchema = z.object({
    tabId: z.coerce.number().int().min(0, "Tab ID must be a positive number."),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id || !session.user.username) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const validated = startSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Invalid Tab ID provided." },
                { status: 400 }
            );
        }

        const { tabId } = validated.data;
        const username = session.user.username;
        const userId = session.user.id;

        const tfoApiUrl = `https://finaloutpost.net/api/v1/tab/${tabId}/${username}`;
        const response = await fetch(tfoApiUrl, {
            headers: { "X-API-Key": process.env.TFO_API_KEY! },
        });
        const data = await response.json();

        if (data.error || !data.creatures || data.creatures.length === 0) {
            return NextResponse.json(
                {
                    error: `Could not find any creatures in Tab ${tabId} to use for verification.`,
                },
                { status: 404 }
            );
        }

        const randomCreature =
            data.creatures[Math.floor(Math.random() * data.creatures.length)];
        const creatureCode = randomCreature.code;
        const verificationToken = `verify-${crypto
            .randomBytes(4)
            .toString("hex")}`;
        const expiresAt = new Date(new Date().getTime() + 15 * 60 * 1000);

        await db
            .insert(accountVerifications)
            .values({
                userId: userId,
                creatureCode: creatureCode,
                verificationToken: verificationToken,
                expiresAt: expiresAt,
            })
            .onConflictDoUpdate({
                target: accountVerifications.userId,
                set: {
                    creatureCode: creatureCode,
                    verificationToken: verificationToken,
                    expiresAt: expiresAt,
                },
            });

        return NextResponse.json({ creatureCode, verificationToken });
    } catch (error) {
        console.error("Verification start failed:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
