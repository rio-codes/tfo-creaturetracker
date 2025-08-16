import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const getVisiblePages = () => {
    const pages = []

    // Always show first page
    pages.push(1)

    // Show current page and surrounding pages
    if (currentPage > 3) {
      pages.push("...")
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i)
      }
    }

    // Show last pages
    if (currentPage < totalPages - 2) {
      pages.push("...")
    }

    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex justify-center items-center gap-2">
      <Button variant="ghost" size="sm" disabled={currentPage === 1} className="text-purple-700 hover:bg-purple-200">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      {getVisiblePages().map((page, index) => (
        <Button
          key={index}
          variant={page === currentPage ? "default" : "ghost"}
          size="sm"
          className={
            page === currentPage
              ? "bg-purple-700 text-white hover:bg-purple-800"
              : "text-purple-700 hover:bg-purple-200"
          }
          disabled={page === "..."}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === totalPages}
        className="text-purple-700 hover:bg-purple-200"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}
