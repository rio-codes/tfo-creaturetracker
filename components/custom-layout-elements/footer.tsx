'use client';
import { ToggleButton, ToggleButtonGroup, Stack } from '@mui/material';
import Link from 'next/link';
import { Moon, Sun, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { AltRoute } from '@mui/icons-material';

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
    const { theme, resolvedTheme, setTheme } = useTheme();
    const { data: session, update } = useSession();
    const [onlineCount, setOnlineCount] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchOnlineCount = useCallback(async () => {
        try {
            const response = await fetch('/api/metrics/online-users');
            if (response.ok) {
                const data = await response.json();
                setOnlineCount(data.onlineCount);
            }
        } catch (error) {
            console.error('Failed to fetch online user count:', error);
        }
    }, []);

    useEffect(() => {
        fetchOnlineCount();
        const interval = setInterval(fetchOnlineCount, 60000); // Refresh every 60 seconds
        return () => clearInterval(interval);
    }, [fetchOnlineCount]);

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
