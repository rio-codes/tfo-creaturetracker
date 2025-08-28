"use client";
import GoalForm from "@/components/custom-forms/goal-form"

type DialogProps = {
    goalMode: string;
    isOpen: boolean;
    onClose: () => void;
};

type SyncStatus = "idle" | "loading" | "success" | "error";

export function AddGoalDialog({ goalMode, isOpen, onClose }: DialogProps) {
    if (!isOpen) {
        return null;
    }

    const handleClose = () => {
        onClose();
    }

    return (
        <div
            className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center"
            onClick={handleClose}
        >
            <div
                className="bg-barely-lilac rounded-lg shadow-xl overflow-y-auto p-6 space-y-4 w-full max-h-3/4 max-w-md z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-pompaca-purple mb-4">New Research Goal</h2>
                <GoalForm />
            </div>
        </div>
    );
}
