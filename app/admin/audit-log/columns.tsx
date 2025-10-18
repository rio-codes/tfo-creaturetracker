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

export type EnrichedAuditLogEntry = {
    id: string;
    timestamp: Date;
    adminId: string | null;
    adminUsername: string | null;
    action: string;
    targetType: string | null;
    targetId: string | null;
    targetUserId: string | null;
    targetUsername: string | null;
    details: Record<string, any> | null;
};

export const columns: ColumnDef<EnrichedAuditLogEntry>[] = [
    {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: ({ row }) => {
            const date = new Date(row.original.timestamp);
            return (
                <div className="flex flex-col">
                    <span>{date.toLocaleDateString()}</span>
                    <span className="text-xs text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                        {date.toLocaleTimeString()}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: 'adminUsername',
        header: 'Admin',
        cell: ({ row }) => {
            const username = row.original.adminUsername;
            return username || <span className="italic text-dusk-purple">System/Unknown</span>;
        },
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
        accessorKey: 'targetUsername',
        header: 'Target Username',
        cell: ({ row }) => {
            const username = row.original.targetUsername;
            return (
                <div className="max-w-xs truncate" title={username || ''}>
                    {username}
                </div>
            );
        },
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
                            className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50"
                        >
                            View
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-barely-lilac dark:bg-deep-purple">
                        <DialogHeader>
                            <DialogTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                Action Details
                            </DialogTitle>
                        </DialogHeader>
                        <pre className="mt-2 w-full rounded-md bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-midnight-purple hallowsnight:bg-abyss/50 p-4 overflow-x-auto">
                            <code className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                {JSON.stringify(details, null, 2)}
                            </code>
                        </pre>
                    </DialogContent>
                </Dialog>
            );
        },
    },
];
