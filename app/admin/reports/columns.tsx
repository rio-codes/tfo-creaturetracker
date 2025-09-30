'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export type EnrichedReport = {
    id: string;
    reason: string;
    status: 'open' | 'resolved' | 'dismissed';
    createdAt: Date;
    reporter: { id: string; username: string };
    reported: { id: string; username: string };
};

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'open':
            return 'destructive';
        case 'resolved':
            return 'default';
        case 'dismissed':
            return 'secondary';
        default:
            return 'outline';
    }
};

export const columns: ColumnDef<EnrichedReport>[] = [
    {
        accessorKey: 'reported',
        header: 'Reported User',
        cell: ({ row }) => {
            const { username } = row.original.reported;
            return (
                <Link
                    href={`/${username}`}
                    className="font-medium underline hover:text-pompaca-purple"
                >
                    {username}
                </Link>
            );
        },
        filterFn: (row, id, value) => {
            return row.original.reported.username
                .toLowerCase()
                .includes(String(value).toLowerCase());
        },
    },
    {
        accessorKey: 'reporter',
        header: 'Reporter',
        cell: ({ row }) => {
            const { username } = row.original.reporter;
            return (
                <Link
                    href={`/${username}`}
                    className="font-medium underline hover:text-pompaca-purple"
                >
                    {username}
                </Link>
            );
        },
    },
    {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => {
            const reason = row.original.reason;
            return (
                <div className="max-w-xs truncate" title={reason}>
                    {reason}
                </div>
            );
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const status = row.original.status;
            return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
        },
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
        id: 'actions',
        cell: function Cell({ row }) {
            const router = useRouter();
            const report = row.original;

            const updateReportStatus = async (
                reportId: string,
                status: 'open' | 'resolved' | 'dismissed'
            ) => {
                try {
                    const response = await fetch(`/api/admin/reports/${reportId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status }),
                    });

                    if (!response.ok) {
                        const result = await response.json();
                        throw new Error(result.error || 'Failed to update status.');
                    }

                    toast.success('Report Updated', {
                        description: `The report has been marked as ${status}.`,
                    });
                    router.refresh();
                } catch (error) {
                    toast.error('Update Failed', {
                        description:
                            error instanceof Error ? error.message : 'Please try again later.',
                    });
                }
            };

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(report.id)}>
                            Copy report ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'open')}>
                            Mark as Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'resolved')}>
                            Mark as Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => updateReportStatus(report.id, 'dismissed')}
                        >
                            Mark as Dismissed
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
