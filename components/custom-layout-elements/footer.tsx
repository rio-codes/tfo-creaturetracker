'use client';
import { ToggleButton, ToggleButtonGroup, Stack } from '@mui/material';
import Link from 'next/link';
import { Moon, Sun, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { AltRoute } from '@mui/icons-material';
import { createClient } from '@supabase/supabase-js';

declare module '@mui/material/styles' {
    interface Palette {
        custom: Palette['primary'];
    }

    interface PaletteOptions {
        custom?: PaletteOptions['primary'];
    }
}

declare module '@mui/material/Switch' {
    interface SwitchPropsColorOverrides {
        custom: true;
    }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}
const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseURL, supabaseAnonKey);

export function Footer() {
    const [mounted, setMounted] = useState(false);
    const [onlineCount, setOnlineCount] = useState<number | null>(null);
    const { theme, resolvedTheme, setTheme } = useTheme();
    const { data: session, update } = useSession();

    const presenceRoom = supabase.channel('room:lobby:messages', {
        config: { private: true },
    });
    if (presenceRoom) {
        console.log('Presence room connected');
    } else {
        console.log('Presence room not connected');
    }

    presenceRoom
        .on('presence', { event: 'sync' }, () => {
            const newState = presenceRoom.presenceState();
            let onlineUsersCount = 0;

            for (const _userKey in newState) {
                onlineUsersCount++;
            }
            setOnlineCount(onlineUsersCount);
            console.log('Online users: ', onlineCount);
            console.log('sync', newState);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('join', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('leave', key, leftPresences);
        })
        .subscribe();

    useEffect(() => {
        setMounted(true);
    }, []);

    const userStatus = {
        user: session?.user?.username,
        online_at: new Date().toISOString(),
    };

    presenceRoom.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            const presenceTrackStatus = await presenceRoom.track(userStatus);
            console.log(presenceTrackStatus);
        } else if (status === 'CLOSED') {
            return;
        }
    });

    const handleThemeChange = useCallback(
        async (newTheme: 'light' | 'dark' | 'hallowsnight') => {
            const originalTheme = resolvedTheme; // Capture the theme before changing

            // Optimistically update the UI
            setTheme(newTheme);

            // If user is logged in, persist the setting to the database
            if (session?.user) {
                try {
                    const response = await fetch('/api/settings', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ theme: newTheme }),
                    });

                    if (response.ok) {
                        // Also update the session JWT so it persists across reloads
                        await update({ theme: newTheme });
                    } else {
                        // Revert on failure and notify user
                        setTheme(originalTheme as 'light' | 'dark' | 'hallowsnight');
                        toast.error('Could Not Save Preference', {
                            description:
                                'Your theme preference could not be saved. Please try again.',
                        });
                        console.error('Failed to save theme preference to the database.', response);
                    }
                } catch (error) {
                    // Revert on failure and notify user
                    setTheme(originalTheme as 'light' | 'dark' | 'hallowsnight');
                    toast.error('Network Error', {
                        description:
                            'Your theme preference could not be saved. Please check your connection.',
                    });
                    console.error('Failed to save theme preference:', error);
                }
            }
        },
        [session, setTheme, update, resolvedTheme]
    );
    const year = new Date().getFullYear();
    return (
        <footer className="items-center w-full bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet dark:text-barely-lilac hallowsnight:text-cimo-crimson text-pompaca-purple px-4 py-4 mt-auto">
            <div className="flex flex-wrap justify-between text-sm max-w-full">
                <div className="mb-4 md:mb-0">
                    <span>
                        ©{year} Rio S., licensed under{' '}
                        <a
                            href="https://www.gnu.org/licenses/agpl-3.0.en.html"
                            className="underline hover:no-underline"
                        >
                            AGPL-3.0
                        </a>
                        .
                    </span>
                    <br></br>
                    <span>
                        All art is the copyright of respective artists on{' '}
                        <a href="https://finaloutpost.net/" className="underline">
                            The Final Outpost
                        </a>
                    </span>
                </div>
                <div className="flex-col justify-items-end">
                    <div className="flex flex-wrap justify-end items-center gap-x-4 gap-y-2">
                        <Link href="/terms" className="hover:underline">
                            Terms of Service
                        </Link>
                        <span className="hidden md:inline">|</span>
                        <Link href="/privacy" className="hover:underline">
                            Privacy Policy
                        </Link>
                        <span className="hidden md:inline">|</span>
                        <Link href="/help" className="hover:underline">
                            Help
                        </Link>
                        <span className="hidden md:inline">|</span>
                        <a
                            href="https://github.com/rio-codes/tfo-creaturetracker"
                            className="hover:underline"
                        >
                            Github
                        </a>
                        <span className="hidden md:inline">|</span>
                        <a
                            href="https://patreon.com/tfoct?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
                            className="hover:underline"
                        >
                            Patreon
                        </a>
                        <span className="hidden md:inline">|</span>
                        <a href="https://discord.gg/PMtE3jrXYR" className="hover:underline">
                            Discord
                        </a>
                        <span className="hidden md:inline">|</span>
                        <a href="https://finaloutpost.net/lab/lyricism" className="hover:underline">
                            My Lab
                        </a>
                    </div>
                    {mounted && (
                        <div className="flex items-center justify-end py-2">
                            {onlineCount !== null && (
                                <div className="flex items-center mr-4 text-sm">
                                    <Users className="h-4 w-4 mr-1" />
                                    <span>
                                        {onlineCount} User
                                        {onlineCount !== 1 ? 's' : ''} Online
                                    </span>
                                </div>
                            )}

                            <Stack direction="row" spacing={4}>
                                <ToggleButtonGroup
                                    value={theme}
                                    onChange={(event, newTheme) => {
                                        if (newTheme) {
                                            handleThemeChange(newTheme);
                                        }
                                    }}
                                    exclusive
                                    aria-label="theme"
                                >
                                    <ToggleButton value="light" aria-label="light mode">
                                        <Sun className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson" />
                                    </ToggleButton>
                                    <ToggleButton value="dark" aria-label="dark mode">
                                        <Moon className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson" />
                                    </ToggleButton>
                                    <ToggleButton
                                        value="hallowsnight"
                                        aria-label="hallowsnight mode"
                                    >
                                        <AltRoute className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson" />
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Stack>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
}
