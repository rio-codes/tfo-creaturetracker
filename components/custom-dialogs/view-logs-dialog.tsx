"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EnrichedBreedingPair } from "@/types";
import { format } from "date-fns";

type ViewLogsDialogProps = {
    pair: EnrichedBreedingPair;
    children: React.ReactNode;
};

export function ViewLogsDialog({ pair, children }: ViewLogsDialogProps) {
    // Sort logs by date, newest first
    const sortedLogs =
        pair.logs?.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        ) || [];

    const getProgenyName = (progenyId: string | null) => {
        if (!progenyId) return "N/A";
        const progeny = pair.progeny?.find((p) => p.id === progenyId);
        return progeny
            ? `${progeny.creatureName || "Unnamed"} (${progeny.code})`
            : "Unknown";
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple max-w-2xl"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300">
                        Breeding Logs for {pair.pairName}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] rounded-md border p-4 bg-ebena-lavender/50 dark:bg-midnight-purple/50">
                    {sortedLogs.length > 0 ? (
                        <ul className="space-y-4">
                            {sortedLogs.map((log) => (
                                <li
                                    key={log.id}
                                    className="p-3 rounded-md bg-barely-lilac dark:bg-pompaca-purple/50"
                                >
                                    <div className="flex justify-between items-baseline mb-2">
                                        <p className="font-bold text-pompaca-purple dark:text-purple-300">
                                            {format(
                                                new Date(log.createdAt),
                                                "PPP p"
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-sm space-y-1 text-dusk-purple dark:text-purple-400">
                                        <p>
                                            <strong>Progeny 1:</strong>{" "}
                                            {getProgenyName(log.progeny1Id)}
                                        </p>
                                        <p>
                                            <strong>Progeny 2:</strong>{" "}
                                            {getProgenyName(log.progeny2Id)}
                                        </p>
                                        {log.notes && (
                                            <div className="pt-2">
                                                <p className="font-semibold text-pompaca-purple dark:text-purple-300">
                                                    Notes:
                                                </p>
                                                <blockquote className="border-l-2 border-dusk-purple pl-2 italic">
                                                    {log.notes}
                                                </blockquote>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-dusk-purple dark:text-purple-400 italic">
                            No breeding events have been logged for this pair.
                        </p>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
