import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { userTabs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// GET all tabs for a user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const tabs = await db.query.userTabs.findMany({
            where: eq(userTabs.userId, userId),
            orderBy: (userTabs, { asc }) => [asc(userTabs.createdAt)],
        });
        return NextResponse.json(tabs);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch user tabs." }, { status: 500 });
    }
}

// POST a new tab for a user
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const { tabId, tabName } = await req.json();

        if (typeof tabId !== 'number') {
            return NextResponse.json({ error: "Invalid Tab ID." }, { status: 400 });
        }

        const newTab = await db.insert(userTabs).values({ userId, tabId, tabName: tabName || null }).returning();

        revalidatePath('/collection');
        return NextResponse.json(newTab[0], { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to add new tab." }, { status: 500 });
    }
}