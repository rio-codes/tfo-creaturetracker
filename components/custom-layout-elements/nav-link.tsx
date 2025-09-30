'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavLink({
    href,
    children,
    className,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={cn(
                'justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-pompaca-purple/10 dark:hover:bg-midnight-purple',
                isActive
                    ? 'bg-ebena-lavender dark:bg-pompaca-purple font-semibold text-pompaca-purple dark:text-purple-300'
                    : 'text-dusk-purple dark:text-purple-400',
                className
            )}
        >
            {children}
        </Link>
    );
}
