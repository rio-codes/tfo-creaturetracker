'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type AdminResearchGoal = {
    id: string;
    name: string;
    species: string | null;
    ownerUsername: string;
    createdAt: Date;
};

async function handleDeleteResearchGoal(goalId: string, goalName: string) {
    if (
        confirm(
            `Are you sure you want to delete research goal "${goalName}"? This is a permanent action.`
        )
    ) {
        const res = await fetch(`/api/admin/research-goals/${goalId}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            window.location.reload();
        } else {
            alert('Failed to delete research goal.');
        }
    }
}

export const columns: ColumnDef<AdminResearchGoal>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
            const name = row.original.name;

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="max-w-xs truncate cursor-default">
                                {name}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{name}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
    {
        accessorKey: 'species',
        header: 'Species',
    },
    {
        accessorKey: 'ownerUsername',
        header: 'Owner',
    },
    {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) =>
            new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const goal = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-barely-lilac"
                    >
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            className=" bg-ebena-lavender dark:bg-pompaca-purple text-red-600"
                            onClick={() =>
                                handleDeleteResearchGoal(goal.id, goal.name)
                            }
                        >
                            Delete Goal
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
