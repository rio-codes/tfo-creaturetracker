'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type AuditLogEntry = {
    id: string;
    timestamp: Date;
    adminId: string | null;
    adminUsername: string | null;
    action: string;
    targetType: string | null;
    targetId: string | null;
    details: Record<string, any> | null;
};

export const columns: ColumnDef<AuditLogEntry>[] = [
    {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: ({ row }) => {
            const date = new Date(row.original.timestamp);
            return (
                <div className="flex flex-col">
                    <span>{date.toLocaleDateString()}</span>
                    <span className="text-xs text-dusk-purple dark:text-purple-400">
                        {date.toLocaleTimeString()}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: 'adminUsername',
        header: 'Admin',
        cell: ({ row }) =>
            row.original.adminUsername || (
                <span className="italic text-dusk-purple">System/Unknown</span>
            ),
    },
    {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => <Badge variant="secondary">{row.original.action}</Badge>,
    },
    {
        accessorKey: 'targetType',
        header: 'Target Type',
    },
    {
        accessorKey: 'targetId',
        header: 'Target ID',
        cell: ({ row }) => (
            <div className="max-w-xs truncate" title={row.original.targetId || ''}>
                {row.original.targetId}
            </div>
        ),
    },
    {
        accessorKey: 'details',
        header: 'Details',
        cell: ({ row }) => {
            const details = row.original.details;
            if (!details) return null;
            return (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50"
                        >
                            View
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-barely-lilac dark:bg-deep-purple">
                        <DialogHeader>
                            <DialogTitle className="text-pompaca-purple dark:text-purple-300">
                                Action Details
                            </DialogTitle>
                        </DialogHeader>
                        <pre className="mt-2 w-full rounded-md bg-ebena-lavender/50 dark:bg-midnight-purple/50 p-4 overflow-x-auto">
                            <code className="text-pompaca-purple dark:text-purple-300">
                                {JSON.stringify(details, null, 2)}
                            </code>
                        </pre>
                    </DialogContent>
                </Dialog>
            );
        },
    },
];
