"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type AdminBreedingPair = {
    id: string;
    pairName: string;
    species: string | null;
    ownerUsername: string;
    createdAt: Date;
};

async function handleDeleteBreedingPair(pairId: string, pairName: string) {
    if (
        confirm(
            `Are you sure you want to delete breeding pair "${pairName}"? This is a permanent action.`
        )
    ) {
        const res = await fetch(`/api/admin/breeding-pairs/${pairId}`, {
            method: "DELETE",
        });
        if (res.ok) {
            window.location.reload();
        } else {
            alert("Failed to delete breeding pair.");
        }
    }
}

export const columns: ColumnDef<AdminBreedingPair>[] = [
    {
        accessorKey: "pairName",
        header: "Name",
        cell: ({ row }) => {
            const name = row.original.pairName;

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
        accessorKey: "species",
        header: "Species",
    },
    {
        accessorKey: "ownerUsername",
        header: "Owner",
    },
    {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) =>
            new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const pair = row.original;
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
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                                handleDeleteBreedingPair(pair.id, pair.pairName)
                            }
                        >
                            Delete Pair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
