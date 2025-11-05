'use client';
import { ToggleButton, ToggleButtonGroup, Stack } from '@mui/material';
import Link from 'next/link';
import { Moon, Sun, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { AltRoute } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';

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

export function Footer() {
    const [mounted, setMounted] = useState(false);
    const [onlineCount, setOnlineCount] = useState<number | null>(null);
    const { theme, resolvedTheme, setTheme } = useTheme();
    const { data: session, update } = useSession();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Generate a unique key for this specific client connection
        const presenceKey = `${session?.user?.id || 'anon'}-${Math.random().toString(36).substring(2, 9)}`;

        const presenceRoom = supabase.channel('lobby', {
            config: {
                presence: {
                    key: presenceKey,
                },
            },
        });

        const handleSync = () => {
            const newState = presenceRoom.presenceState();
            // The state is an object where keys are the unique presenceKeys.
            // The number of keys is the number of online connections.
            const count = Object.keys(newState).length;
            setOnlineCount(count);
        };

        presenceRoom
            .on('presence', { event: 'sync' }, handleSync)
            .on('presence', { event: 'join' }, (payload) => {
                console.log('User joined:', payload);
                handleSync();
            })
            .on('presence', { event: 'leave' }, (payload) => {
                console.log('User left:', payload);
                handleSync();
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceRoom.track({
                        user_id: session?.user?.id || null,
                        username: session?.user?.username || 'Anonymous',
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            presenceRoom.unsubscribe();
        };
    }, [session]); // Depend on the whole session object

    const handleThemeChange = useCallback(
        // ... (this function remains the same)
        async (newTheme: 'light' | 'dark' | 'hallowsnight') => {
            const originalTheme = resolvedTheme;
            setTheme(newTheme);

            if (session?.user) {
                try {
                    const response = await fetch('/api/settings', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ theme: newTheme }),
                    });

                    if (response.ok) {
                        await update({ theme: newTheme });
                    } else {
                        setTheme(originalTheme as 'light' | 'dark' | 'hallowsnight');
                        toast.error('Could Not Save Preference', {
                            description:
                                'Your theme preference could not be saved. Please try again.',
                        });
                        console.error('Failed to save theme preference to the database.', response);
                    }
                } catch (error) {
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
                        All creature art is the copyright of respective artists on{' '}
                        <a href="https://finaloutpost.net/" className="underline">
                            The Final Outpost
                        </a>
                        .
                    </span>
                    <br></br>
                    <span>
                        Icons on navigation buttons designed by{' '}
                        <a href="https://game-icons.net/about.html#authors" className="underline">
                            contributors to game-icons.net
                        </a>
                        .
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
