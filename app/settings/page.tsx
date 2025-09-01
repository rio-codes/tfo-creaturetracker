import { auth } from "@/auth";
import { db } from "@/src/db";
import { users, researchGoals } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/custom-forms/settings-form";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const session = await auth();

    const [user, allGoals] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
        db.query.researchGoals.findMany({
            where: eq(researchGoals.userId, session.user.id),
        }),
    ]);

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple min-h-screen">
            <div className="container mx-auto py-10">
                <h1 className="text-4xl font-bold mb-6 text-pompaca-purple dark:text-purple-300">
                    Settings
                </h1>
                <SettingsForm user={user} goals={allGoals} />
            </div>
        </div>
    );
}