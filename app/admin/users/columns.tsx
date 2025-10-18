'use client';

import { RESERVED_USER_PATHS } from '@/constants/paths';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';

function getProfilePath(username: string): string {
    if (RESERVED_USER_PATHS.includes(username.toLowerCase())) {
        return `/tfoct-${username}`;
    }
    return `/${username}`;
}

async function handleSuspendUser(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (
        confirm(
            `Are you sure you want to ${newStatus === 'active' ? 'unsuspend' : 'suspend'} this user?`
        )
    ) {
        await fetch(`/api/admin/users/${userId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        // Here you would typically trigger a re-fetch of the data
        window.location.reload();
    }
}

async function handleSetFlair(userId: string, tier: string) {
    if (!confirm(`Are you sure you want to set this user's flair to "${tier}"?`)) {
        return;
    }
    try {
        const res = await fetch(`/api/admin/users/${userId}/flair`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier }),
        });
        if (res.ok) {
            window.location.reload();
        } else {
            const data = await res.json();
            alert(`Failed to set flair: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred while setting flair.');
    }
}

async function handleImpersonate(userId: string) {
    if (
        confirm(
            'Are you sure you want to log in as this user? You will be logged out of your admin account.'
        )
    ) {
        const res = await fetch('/api/admin/impersonate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        if (res.ok) {
            window.location.href = '/collection';
        } else {
            alert('Failed to impersonate user.');
        }
    }
}

async function handleDeleteUser(userId: string, username: string) {
    if (
        confirm(
            `Are you sure you want to permanently delete user "${username}"? This action cannot be undone.`
        )
    ) {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            window.location.reload();
        } else {
            const data = await res.json();
            alert(`Failed to delete user: ${data.error || 'Unknown error'}`);
        }
    }
}

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => (
            <Link
                href={getProfilePath(row.original.username)}
                className="hover:underline"
                prefetch={false}
            >
                {row.original.username}
            </Link>
        ),
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Email
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
            <Badge
                variant="outline"
                className="border-pompaca-purple/50 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson"
            >
                {row.original.role}
            </Badge>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status;
            const className =
                status === 'suspended' ? 'bg-red-500/80 text-white' : 'bg-green-500/80 text-white';
            return <Badge className={className}>{status}</Badge>;
        },
    },
    {
        accessorKey: 'createdAt',
        header: 'Registered',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const user = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => handleImpersonate(user.id)}
                            className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                        >
                            Impersonate User
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                <span>Set Flair</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                <DropdownMenuItem
                                    onClick={() => handleSetFlair(user.id, 'researcher')}
                                >
                                    None
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Internal</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleSetFlair(user.id, 'admin')}>
                                    Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleSetFlair(user.id, 'beta_tester')}
                                >
                                    Beta Tester
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Supporter</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => handleSetFlair(user.id, 'postdoc')}
                                >
                                    Postdoc
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleSetFlair(user.id, 'assoc_prof')}
                                >
                                    Assoc. Prof
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleSetFlair(user.id, 'tenured_prof')}
                                >
                                    Tenured Prof
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleSuspendUser(user.id, user.status)}
                            className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                        >
                            {user.status === 'active' ? 'Suspend User' : 'Unsuspend User'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-red-600"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                        >
                            Delete User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
