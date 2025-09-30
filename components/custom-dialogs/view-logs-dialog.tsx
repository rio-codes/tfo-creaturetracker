'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EnrichedBreedingPair, EnrichedCreature, DbBreedingLogEntry } from '@/types';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { EditLogDialog } from './edit-log-dialog';

type ViewLogsDialogProps = {
    pair: EnrichedBreedingPair;
    allCreatures: EnrichedCreature[];
    allLogs: DbBreedingLogEntry[];
    children: React.ReactNode;
};

export function ViewLogsDialog({ pair, allCreatures, allLogs, children }: ViewLogsDialogProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Sort logs by date, newest first
    const sortedLogs =
        pair.logs?.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ) || [];

    const getProgenyName = (progenyId: string | null) => {
        if (!progenyId) return 'N/A';
        const progeny = pair.progeny?.find((p) => p?.id === progenyId);
        return progeny ? `${progeny.creatureName || 'Unnamed'} (${progeny.code})` : 'Unknown';
    };

    const handleDelete = async (logId: string) => {
        setIsDeleting(logId);
        setError('');
        try {
            const response = await fetch(`/api/breeding-log`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete log entry.');
            }

            router.refresh();
        } catch (err: any) {
            setError(err.message ?? 'An unexpected error occurred during deletion.');
        } finally {
            setIsDeleting(null);
        }
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
                    {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
                    {sortedLogs.length > 0 ? (
                        <ul className="space-y-4">
                            {sortedLogs.map((log) => (
                                <li
                                    key={log.id}
                                    className="p-3 rounded-md bg-barely-lilac dark:bg-pompaca-purple/50"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-pompaca-purple dark:text-purple-300">
                                                {format(new Date(log.createdAt), 'PPP p')}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <EditLogDialog
                                                log={log}
                                                pair={pair}
                                                allCreatures={allCreatures}
                                                allLogs={allLogs}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </EditLogDialog>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-500 hover:text-red-600"
                                                        disabled={isDeleting === log.id}
                                                    >
                                                        {isDeleting === log.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-barely-lilac dark:bg-pompaca-purple">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Are you sure?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete this log
                                                            entry. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(log.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    <div className="text-sm space-y-1 text-dusk-purple dark:text-purple-400">
                                        <p>
                                            <strong>Progeny 1:</strong>{' '}
                                            {getProgenyName(log.progeny1Id)}
                                        </p>
                                        <p>
                                            <strong>Progeny 2:</strong>{' '}
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
