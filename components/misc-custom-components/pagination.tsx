'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import * as React from 'react';

type PaginationProps = {
    totalPages: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
};

export function Pagination({
    totalPages,
    currentPage: controlledPage,
    onPageChange,
}: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentPage = controlledPage ?? (Number(searchParams.get('page')) || 1);

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const handlePageClick = (page: number) => {
        if (onPageChange) {
            onPageChange(page);
        }
    };

    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 md:gap-4">
            <Button
                asChild={!onPageChange}
                onClick={() => onPageChange && handlePageClick(1)}
                variant="outline"
                size="icon"
                className="border-transparent  bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson flex"
                disabled={isFirstPage}
                aria-disabled={isFirstPage}
                aria-label="Go to first page"
            >
                {onPageChange ? (
                    <ChevronsLeft className="h-4 w-4" />
                ) : (
                    <Link href={createPageURL(1)}>
                        <ChevronsLeft className="h-4 w-4" />
                    </Link>
                )}
            </Button>

            <Button
                asChild={!onPageChange}
                onClick={() => onPageChange && handlePageClick(currentPage - 1)}
                variant="outline"
                className=" bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-cimo-crimson text-pompaca-purple dark:text-barely-lilac hallowsnight:text-abyss"
                disabled={isFirstPage}
                aria-disabled={isFirstPage}
                aria-label="Go to previous page"
            >
                {onPageChange ? (
                    <ChevronLeft className="h-4 w-4" />
                ) : (
                    <Link href={createPageURL(currentPage - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                )}
            </Button>

            <span className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson font-medium">
                Page {currentPage} of {totalPages}
            </span>

            <Button
                asChild={!onPageChange}
                onClick={() => onPageChange && handlePageClick(currentPage + 1)}
                variant="outline"
                className=" bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-cimo-crimson text-pompaca-purple dark:text-barely-lilac hallowsnight:text-abyss"
                disabled={isLastPage}
                aria-disabled={isLastPage}
                aria-label="Go to next page"
            >
                {onPageChange ? (
                    <ChevronRight className="h-4 w-4" />
                ) : (
                    <Link href={createPageURL(currentPage + 1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                )}
            </Button>

            <Button
                asChild={!onPageChange}
                onClick={() => onPageChange && handlePageClick(totalPages)}
                variant="outline"
                size="icon"
                className=" border-transparent  bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson flex"
                disabled={isLastPage}
                aria-disabled={isLastPage}
                aria-label="Go to last page"
            >
                {onPageChange ? (
                    <ChevronsRight className="h-4 w-4" />
                ) : (
                    <Link href={createPageURL(totalPages)}>
                        <ChevronsRight className="h-4 w-4" />
                    </Link>
                )}
            </Button>
        </div>
    );
}
