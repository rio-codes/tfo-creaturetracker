import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncTfoTab } from "@/lib/tfo-sync";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }
    const userId = session.user.id;
    const tfoUsername = session.user.username;

    try {
        const { tabIds } = await req.json();
        if (
            !Array.isArray(tabIds) ||
            tabIds.some((id) => typeof id !== "number")
        ) {
            return NextResponse.json(
                { error: "Invalid tab IDs provided." },
                { status: 400 }
            );
        }

        const results = await Promise.allSettled(
            tabIds.map((tabId) => syncTfoTab(userId, tfoUsername, tabId))
        );

        const successfulSyncs = results
            .filter((r) => r.status === "fulfilled")
            .map((r) => (r as PromiseFulfilledResult<any>).value);
        const failedSyncs = results
            .filter((r) => r.status === "rejected")
            .map((r) => (r as PromiseRejectedResult).reason.message);

        const totalAdded = successfulSyncs.reduce(
            (sum, result) => sum + result.added,
            0
        );
        const totalUpdated = successfulSyncs.reduce(
            (sum, result) => sum + result.updated,
            0
        );

        let message = `Sync complete. Added: ${totalAdded}, Updated: ${totalUpdated}.`;
        if (failedSyncs.length > 0) {
            message += ` Failed to sync ${failedSyncs.length} tabs.`;
        }

        return NextResponse.json({ message, errors: failedSyncs });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "An internal error occurred." },
            { status: 500 }
        );
    }
}