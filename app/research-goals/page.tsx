import { ResearchGoalClient } from "@/components/research-goal-client";
import { Suspense } from "react";

export default function ResearchGoalsPage() {
    return (
        <div className="bg-barely-lilac min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading collection...</div>}>
                </Suspense>
            </div>
        </div>
    );
}
