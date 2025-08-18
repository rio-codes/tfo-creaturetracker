'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="flex items-center gap-4">
      <Link href={createPageURL(currentPage - 1)} passHref legacyBehavior>
        <Button
          variant="outline"
          className="bg-ebena-lavender border-pompaca-purple text-pompaca-purple"
          disabled={isFirstPage}
          aria-disabled={isFirstPage}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
      </Link>

      <span className="text-pompaca-purple font-medium">
        Page {currentPage} of {totalPages}
      </span>

      <Link href={createPageURL(currentPage + 1)} passHref legacyBehavior>
        <Button
          variant="outline"
          className="bg-ebena-lavender border-pompaca-purple text-pompaca-purple"
          disabled={isLastPage}
          aria-disabled={isLastPage}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}