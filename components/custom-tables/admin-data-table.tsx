'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pagination: {
        totalPages: number;
    };
    searchPlaceholder: string;
    onRowClick?: (row: TData) => void;
}

export function AdminDataTable<TData, TValue>({
    columns,
    data,
    pagination,
    searchPlaceholder,
    onRowClick,
}: DataTableProps<TData, TValue>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get('page')) || 1;

    const table = useReactTable({
        data,
        columns,
        pageCount: pagination.totalPages,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
    });

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center py-4">
                <Input
                    placeholder={searchPlaceholder}
                    defaultValue={searchParams.get('query')?.toString()}
                    onChange={(event) => handleSearch(event.target.value)}
                    className="max-w-sm bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50 placeholder:text-dusk-purple"
                />
            </div>
            <div className="rounded-md border border-pompaca-purple/30">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-pompaca-purple/30">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    onClick={() => onRowClick?.(row.original)}
                                    className={cn(
                                        'border-pompaca-purple/30',
                                        onRowClick &&
                                            'cursor-pointer hover:bg-pompaca-purple/10 dark:hover:bg-midnight-purple'
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(createPageURL(currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50"
                >
                    Previous
                </Button>
                <span className="text-sm text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                    Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(createPageURL(currentPage + 1))}
                    disabled={currentPage >= pagination.totalPages}
                    className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50"
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
