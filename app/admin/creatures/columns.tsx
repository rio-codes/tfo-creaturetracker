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
import Link from 'next/link';

type AdminCreature = {
    id: string;
    code: string;
    creatureName: string | null;
    species: string | null;
    gender: 'male' | 'female' | 'genderless' | 'unknown' | null;
    ownerUsername: string;
    createdAt: Date;
};

async function handleDeleteCreature(creatureId: string, creatureCode: string) {
    if (
        confirm(
            `Are you sure you want to delete creature ${creatureCode}? This is a permanent action.`
        )
    ) {
        const res = await fetch(`/api/admin/creatures/${creatureId}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            window.location.reload();
        } else {
            alert('Failed to delete creature.');
        }
    }
}

export const columns: ColumnDef<AdminCreature>[] = [
    {
        accessorKey: 'creatureName',
        header: 'Name',
        cell: ({ row }) =>
            row.original.creatureName || (
                <span className="text-muted-foreground italic">Unnamed</span>
            ),
    },
    {
        accessorKey: 'code',
        header: 'Code',
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
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const creature = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-barely-lilac">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            className="bg-ebena-lavender dark:bg-pompaca-purple "
                            asChild
                        >
                            <Link
                                href={`https://finaloutpost.net/view/${creature.code}`}
                                target="_blank"
                            >
                                View on TFO
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="bg-ebena-lavender dark:bg-pompaca-purple text-red-600"
                            onClick={() => handleDeleteCreature(creature.id, creature.code)}
                        >
                            Delete Creature
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
