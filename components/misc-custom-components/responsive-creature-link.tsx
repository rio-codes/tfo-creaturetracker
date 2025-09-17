'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function getCacheBustedImageUrl(imageUrl: string | null, updatedAt?: string | Date | null) {
    if (!imageUrl) {
        return '/images/misc/placeholder.png';
    }
    if (updatedAt) {
        return `${imageUrl}?v=${new Date(updatedAt).getTime()}`;
    }
    return imageUrl;
}

export function ResponsiveCreatureLink({
    displayText,
    code,
    imageUrl,
    updatedAt,
    className,
}: {
    displayText: string;
    code: string;
    imageUrl: string | null;
    updatedAt?: string | Date | null;
    className?: string;
}) {
    const finalImageUrl = getCacheBustedImageUrl(imageUrl, updatedAt);

    return (
        <>
            {/* Desktop: Tooltip on a link */}
            <span className={`hidden md:inline ${className}`}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href={`https://finaloutpost.net/view/${code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-pompaca-purple dark:hover:text-purple-300"
                            >
                                {displayText}
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                            <img
                                src={finalImageUrl}
                                alt={displayText}
                                className="w-24 h-24 object-contain rounded-md bg-white/10 p-1"
                            />
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </span>
            {/* Mobile: Popover */}
            <span className={`inline md:hidden ${className}`}>
                <Popover>
                    <PopoverTrigger asChild>
                        <span className="underline cursor-pointer">{displayText}</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <div className="flex flex-col gap-2 items-center">
                            <img
                                src={finalImageUrl}
                                alt={displayText}
                                className="w-24 h-24 object-contain rounded-md bg-white/10 p-1"
                            />
                            <Link
                                href={`https://finaloutpost.net/view/${code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm underline"
                            >
                                View on TFO <ExternalLink className="h-4 w-4" />
                            </Link>
                        </div>
                    </PopoverContent>
                </Popover>
            </span>
        </>
    );
}
