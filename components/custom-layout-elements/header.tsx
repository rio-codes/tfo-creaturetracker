'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Menu, LogIn, LogOut, Loader2, User, Settings, Logs, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getRandomCapsuleAvatar } from '@/lib/avatars';
import { RESERVED_USER_PATHS } from '@/constants/paths';
import { NotificationBell } from '@/components/custom-layout-elements/notification-bell';
import { NotificationBell } from '@/components/custom-layout-elements/notification-bell';

function getProfilePath(username: string): string {
    if (RESERVED_USER_PATHS.includes(username.toLowerCase())) {
        return `/tfoct-${username}`;
    }
    return `/${username}`;
}
export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session, status } = useSession();

    const menuItems = [
        { href: '/collection', label: 'Collection', icon: '🦋' },
        { href: '/research-goals', label: 'Research Goals', icon: '🧪' },
        { href: '/breeding-pairs', label: 'Breeding Pairs', icon: '💜' },
        { href: '/help', label: 'Help', icon: '❓' },
    ];

    const adminMenuItem = {
        href: '/admin',
        label: 'Admin',
        icon: '🧑🏾‍💻',
    };

    const renderMenuItem = (item: { href: string; label: string; icon: string }) => (
        <DropdownMenuItem
            key={item.href}
            className="cursor-pointer focus:bg-dusk-purple dark:focus:bg-midnight-purple hallowsnight:focus:bg-cimo-crimson/75 h-10"
            asChild
        >
            <Link
                href={item.href}
                className="text-lg w-full h-full text-pompaca-purple dark:text-pompaca-purple hallowsnight:text-cimo-crimson/75"
            >
                <span className="mr-2">{item.icon}</span> {item.label}
            </Link>
        </DropdownMenuItem>
    );

    return (
        <header className="bg-pompaca-purple hallowsnight:bg-blood-bay-wine text-barely-lilac hallowsnight:text-cimo-crimson/75 px-2 sm:px-4 py-2 flex items-center justify-between shadow-md">
            {/* Left side: Menu, Logo, and Title */}
            <div className="flex items-center gap-2">
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-barely-lilac hallowsnight:text-cimo-crimson/75 hover:bg-dusk-purple hallowsnight:hover:bg-cimo-crimson  focus-visible:ring-1 focus-visible:ring-ring rounded-md"
                        >
                            <Menu className="h-9 w-9" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="w-56 bg-barely-lilac hallowsnight:bg-cimo-crimsondark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson/75 hallowsnight:border-cimo-crimson border-dusk-purple dark:text-pompaca-purple"
                    >
                        {menuItems.map(renderMenuItem)}
                        {session?.user?.role === 'admin' && renderMenuItem(adminMenuItem)}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/images/icons/icon.svg"
                        alt="TFO.creaturetracker logo"
                        width={260}
                        height={134}
                        className="h-10 w-auto"
                    />
                    <div className="hidden sm:block">
                        <p className="text-md font-semibold text-purple-200 hallowsnight:text-cimo-crimson/75">
                            Breeding tracker for The Final Outpost
                        </p>
                    </div>
                </Link>
            </div>

            {/* Right side: Auth Status */}
            <div className="flex items-center">
                {status === 'loading' && (
                    <Loader2 className="h-6 w-6 animate-spin text-barely-lilac hallowsnight:text-cimo-crimson" />
                )}

                {status === 'authenticated' && session.user && (
                    <>
                        <NotificationBell />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="flex items-center gap-2 rounded-full hallowsnight:bg-blood-bay-wine bg-dusk-purple/20 p-2 pr-4 border-1 border-barely-lilac hallowsnight:border-cimo-crimson">
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
                                        width={30}
                                        height={30}
                                        className="rounded-full p-1"
                                    />
                                    {session.user.username && (
                                        <span className="font-semibold text-barely-lilac hallowsnight:text-cimo-crimson">
                                            {session.user.username}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56 bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-dusk-purple font-semibold"
                                align="end"
                            >
                                <DropdownMenuItem className="focus:bg-transparent cursor-default">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold leading-none text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson/75">
                                            Signed in as
                                        </p>
                                        <p className="text-xs leading-none text-gray-600 dark:text-gray-400 truncate">
                                            {session.user.username}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-dusk-purple" />
                                <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer focus:bg-dusk-purple dark:focus:bg-midnight-purple"
                                >
                                    <Link href={getProfilePath(session.user.username)}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer focus:bg-dusk-purple dark:focus:bg-midnight-purple"
                                >
                                    <Link href="/messages">
                                        <Mail className="mr-2 h-4 w-4" />
                                        <span>Messages</span>
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer focus:bg-dusk-purple dark:focus:bg-midnight-purple"
                                >
                                    <Link href="/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer focus:bg-dusk-purple dark:focus:bg-midnight-purple"
                                >
                                    <Link href="/account/activity">
                                        <Logs className="mr-2 h-4 w-4" />
                                        <span>Activity Log</span>
                                    </Link>
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
                    </>
                )}

                {status === 'unauthenticated' && (
                    <Button
                        onClick={() => signIn()}
                        variant="outline"
                        className="border-purple-300 text-purple-300 hover:bg-dusk-purple hover:text-barely-lilac hallowsnight:border-cimo-crimson/75 hallowsnight:hover:bg-cimo-crimson/75 hallowsnight:text-cimo-crimson/75 hallowsnight:font-semibold"
                    >
                        <LogIn className="h-5 w-5 sm:mr-2" />
                        <span className="hidden sm:inline">Log In</span>
                    </Button>
                )}
            </div>
        </header>
    );
}
