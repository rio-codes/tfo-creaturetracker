'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ChevronsDown, LogIn, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session, status } = useSession();

    const menuItems = [
        { href: '/collection', label: 'Collection', icon: '🦋' },
        { href: '/research-goals', label: 'Research Goals', icon: '🧪' },
        { href: '/breeding-pairs', label: 'Breeding Pairs', icon: '💜' },
        { href: '/settings', label: 'Settings', icon: '🔧' },
    ];

    const adminMenuItem = {
        href: '/admin',
        label: 'Admin',
        icon: '🧑🏾‍💻',
    };

    const renderMenuItem = (item: {
        href: string;
        label: string;
        icon: string;
    }) => (
        <DropdownMenuItem
            key={item.href}
            className="bg-barely-lilac dark:bg-pompaca-purple hover:bg-dusk-purple dark:hover:bg-midnight-purple h-10"
            asChild
        >
            <Link
                href={item.href}
                className="text-lg w-full h-full text-pompaca-purple dark:text-barely-lilac"
            >
                {item.icon} {item.label}
            </Link>
        </DropdownMenuItem>
    );

    return (
        <header className="bg-pompaca-purple dark:bg-pompaca-purple text-barely-lilac px-2 py-2 max-h-28">
            <div className="flex items-center justify-between">
                {/* Left side - Menu and logo */}
                <div className="flex items-center gap-2">
                    <DropdownMenu
                        open={isMenuOpen}
                        onOpenChange={setIsMenuOpen}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button className="text-barely-lilac hover:bg-transparent focus-visible:ring-0">
                                <ChevronsDown className="size-10" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="w-50 bg-barely-lilac dark:bg-pompaca-purple border-dusk-purple"
                        >
                            {menuItems.map(renderMenuItem)}
                            {session?.user?.role === 'admin' &&
                                renderMenuItem(adminMenuItem)}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-2">
                        <div className="text-yellow-300 text-2xl">
                            <Link href="/">🧬</Link>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-regular mr-2 truncate">
                                <Link href="/">TFO.creaturetracker</Link>
                            </h1>
                            <p className="text-sm text-purple-200 hidden sm:block">
                                <Link href="/">
                                    a breeding tracker for The Final Outpost
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right side - User info and actions */}
                {status === 'authenticated' && (
                    <div className="flex md:flex-col items-between py-1">
                        <div className="py-1 hidden md:justify-end-safe md:flex wrap-normal overflow-auto">
                            Welcome back,
                            <br /> {session.user.username}!
                        </div>
                        <div className="py-1 px-1 md:flex-col">
                            <Button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                variant="ghost"
                                size="sm"
                                className="text-pompaca-purple bg-ebena-lavender hover:bg-dusk-purple dark:bg-midnight-purple dark:text-purple-300 dark:hover:bg-ebena-lavender dark:hover:text-pompaca-purple shadow-xl right-2 top-3"
                            >
                                <span className="hidden sm:inline">
                                    Log Out
                                </span>
                                <LogOut className="h-4 w-4 sm:ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
                {status === 'loading' && (
                    <div className="flex flex-col items-end py-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="text-barely-lilac"
                        >
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </Button>
                    </div>
                )}
                {status != 'authenticated' && status != 'loading' && (
                    <div className="flex flex-col justify-end items-end py-1">
                        <Button
                            onClick={() => signIn()}
                            variant="ghost"
                            size="icon"
                            className="text-barely-lilac hover:bg-dusk-purple"
                        >
                            <span className="hidden sm:inline">Log In</span>
                            <LogIn className="h-4 w-4 sm:ml-2" />
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
}
