import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { breedingPairs } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { enrichAndSerializeCreature } from "@/lib/serialization";
import { calculateAllPossibleOutcomes } from "@/lib/genetics";

export async function GET(
    req: Request,
    { params }: { params: { pairId: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const pair = await db.query.breedingPairs.findFirst({
            where: and(
                eq(breedingPairs.id, params.pairId),
                eq(breedingPairs.userId, session.user.id)
            ),
            with: {
                maleParent: true,
                femaleParent: true,
            },
        });

        if (!pair || !pair.maleParent || !pair.femaleParent) {
            return NextResponse.json({ error: "Breeding pair not found or parents are missing." }, { status: 404 });
        }

        const maleParent = enrichAndSerializeCreature(pair.maleParent);
        const femaleParent = enrichAndSerializeCreature(pair.femaleParent);

        const outcomes = calculateAllPossibleOutcomes(maleParent, femaleParent);

        return NextResponse.json({ outcomes });
    } catch (error: any) {
        console.error("Failed to calculate breeding outcomes:", error);
        return NextResponse.json({ error: "An internal error occurred." }, { status: 500 });
    }
}
