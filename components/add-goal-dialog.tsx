"use client";
import AddGoalForm from "@/components/add-goal-form";

type DialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

type SyncStatus = "idle" | "loading" | "success" | "error";

export function AddGoalDialog({ isOpen, onClose }: DialogProps) {
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
                className="bg-barely-lilac rounded-lg shadow-xl overflow-y-scroll p-6 space-y-4 w-full max-h-3/4 max-w-md z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-pompaca-purple mb-4">New Research Goal</h2>
                <AddGoalForm onClose={onClose}/>
            </div>
        </div>
    );
}
