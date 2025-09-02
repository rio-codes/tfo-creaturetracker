import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { breedingPairs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit";

export async function DELETE(
    req: Request,
    { params }: { params: { pairId: string } }
) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    try {
        const targetPair = await db.query.breedingPairs.findFirst({
            where: eq(breedingPairs.id, params.pairId),
            columns: { pairName: true },
        });

        if (!targetPair) {
            return NextResponse.json(
                { error: "Breeding pair not found." },
                { status: 404 }
            );
        }

        await db
            .delete(breedingPairs)
            .where(eq(breedingPairs.id, params.pairId));

        await logAdminAction({
            action: "breeding_pair.delete",
            targetType: "breeding_pair",
            targetId: params.pairId,
            details: {
                deletedPairName: targetPair.pairName,
            },
        });

        return NextResponse.json({
            message: "Breeding pair deleted successfully.",
        });
    } catch (error) {
        console.error("Failed to delete breeding pair:", error);
        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
