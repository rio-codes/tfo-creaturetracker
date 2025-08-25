'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page
  }

  return (
    <div className="flex items-center gap-2 md:gap-4">
      {/* First Page Button */}
      <Link href={createPageURL(1)} passHref>
        <Button
          variant="outline"
          size="icon"
          className="bg-transparent border-transparent text-pompaca-purple flex"
          disabled={isFirstPage}
          aria-disabled={isFirstPage}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </Link>
      
      {/* Previous Page Button */}
      <Link href={createPageURL(currentPage - 1)} passHref>
        <Button
          variant="outline"
          className="bg-pompaca-purple text-barely-lilac"
          disabled={isFirstPage}
          aria-disabled={isFirstPage}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </Link>

      <span className="text-pompaca-purple font-medium">
        Page {currentPage} of {totalPages}
      </span>

      {/* Next Page Button */}
      <Link href={createPageURL(currentPage + 1)} passHref>
        <Button
          variant="outline"
          className="bg-pompaca-purple text-barely-lilac"
          disabled={isLastPage}
          aria-disabled={isLastPage}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
      
      {/* Last Page Button */}
      <Link href={createPageURL(totalPages)} passHref>
        <Button
          variant="outline"
          size="icon"
          className="bg-transparent border-transparent text-pompaca-purple flex"
          disabled={isLastPage}
          aria-disabled={isLastPage}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}