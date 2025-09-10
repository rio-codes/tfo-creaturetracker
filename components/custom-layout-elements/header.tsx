'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Menu, LogIn, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getRandomCapsuleAvatar } from '@/lib/avatars';
export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChangingAvatar, setIsChangingAvatar] = useState(false);
    const { data: session, status, update } = useSession();

    const menuItems = [
        { href: '/collection', label: 'Collection', icon: '🦋' },
        { href: '/research-goals', label: 'Research Goals', icon: '🧪' },
        { href: '/breeding-pairs', label: 'Breeding Pairs', icon: '💜' },
        { href: '/settings', label: 'Settings', icon: '🔧' },
        { href: '/help', label: 'Help', icon: '❓' },
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
            className="cursor-pointer focus:bg-dusk-purple dark:focus:bg-midnight-purple h-10"
            asChild
        >
            <Link
                href={item.href}
                className="text-lg w-full h-full text-pompaca-purple dark:text-barely-lilac"
            >
                <span className="mr-2">{item.icon}</span> {item.label}
            </Link>
        </DropdownMenuItem>
    );

    const handleChangeAvatar = async () => {
        if (isChangingAvatar) return;
        setIsChangingAvatar(true);
        try {
            const response = await fetch('/api/users/change-avatar', {
                method: 'POST',
            });
            if (response.ok) {
                const data = await response.json();
                // Directly update the session with the new image URL from the API response
                await update({ image: data.newAvatar });
            } else {
                console.error('Failed to change avatar');
            }
        } catch (error) {
            console.error('An error occurred while changing avatar:', error);
        } finally {
            setIsChangingAvatar(false);
        }
    };

    return (
        <header className="bg-pompaca-purple text-barely-lilac px-2 sm:px-4 py-2 flex items-center justify-between shadow-md">
            {/* Left side: Menu, Logo, and Title */}
            <div className="flex items-center gap-2">
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-barely-lilac hover:bg-dusk-purple focus-visible:ring-1 focus-visible:ring-ring rounded-md"
                        >
                            <Menu className="h-9 w-9" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="w-56 bg-barely-lilac dark:bg-pompaca-purple border-dusk-purple"
                    >
                        {menuItems.map(renderMenuItem)}
                        {session?.user?.role === 'admin' &&
                            renderMenuItem(adminMenuItem)}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/icon.svg"
                        alt="TFO.creaturetracker logo"
                        // Use aspect ratio from SVG's viewBox for correct rendering
                        width={260}
                        height={134}
                        className="h-10 w-auto"
                    />
                    <div className="hidden sm:block">
                        <p className="text-xs text-purple-200">
                            Breeding tracker for The Final Outpost
                        </p>
                    </div>
                </Link>
            </div>

            {/* Right side: Auth Status */}
            <div className="flex items-center">
                {status === 'loading' && (
                    <Loader2 className="h-6 w-6 animate-spin text-barely-lilac" />
                )}

                {status === 'authenticated' && session.user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="relative h-12 w-12 bg-dusk-purple rounded-full">
                                <Image
                                    key={
                                        session.user.image ||
                                        getRandomCapsuleAvatar(session.user.id)
                                    }
                                    src={
                                        session.user.image ||
                                        getRandomCapsuleAvatar(session.user.id)
                                    }
                                    alt={session.user.username || 'User avatar'}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56 bg-barely-lilac dark:bg-pompaca-purple border-dusk-purple"
                            align="end"
                        >
                            <DropdownMenuItem className="focus:bg-transparent cursor-default">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none text-pompaca-purple dark:text-barely-lilac">
                                        Signed in as
                                    </p>
                                    <p className="text-xs leading-none text-gray-600 dark:text-gray-400 truncate">
                                        {session.user.username}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-dusk-purple" />
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    // Prevent the menu from closing immediately
                                    e.preventDefault();
                                    handleChangeAvatar();
                                }}
                                disabled={isChangingAvatar}
                                className="cursor-pointer focus:bg-dusk-purple dark:focus:bg-midnight-purple"
                            >
                                {isChangingAvatar ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                <span>
                                    {isChangingAvatar
                                        ? 'Changing...'
                                        : 'Change Avatar'}
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => signOut({ callbackUrl: '/' })}
                                className="cursor-pointer focus:bg-dusk-purple dark:focus:bg-midnight-purple"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {status === 'unauthenticated' && (
                    <Button
                        onClick={() => signIn()}
                        variant="outline"
                        className="border-purple-300 text-purple-300 hover:bg-dusk-purple hover:text-barely-lilac"
                    >
                        <LogIn className="h-5 w-5 sm:mr-2" />
                        <span className="hidden sm:inline">Log In</span>
                    </Button>
                )}
            </div>
        </header>
    );
}
