'use client';
import Link from 'next/link';
import { Switch } from '@mui/material';
import { Moon, Sun } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { createTheme } from '@mui/material/styles';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';

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
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    const muiTheme = createTheme({
        palette: {
            primary: {
                main: '#3C2D63',
                light: '#D0BCFF',
                dark: '#251a3d',
                contrastText: ' #EADDFF',
            },
        },
    });

    const usePurpleTheme = useMuiTheme();

    const year = new Date().getFullYear();
    return (
        <footer className="items-center w-full bg-midnight-purple dark:bg-ebena-lavender text-barely-lilac dark:text-pompaca-purple px-4 py-4 mt-auto">
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
                        <a
                            href="https://finaloutpost.net/"
                            className="underline"
                        >
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
                        <a
                            href="https://discord.gg/PMtE3jrXYR"
                            className="hover:underline"
                        >
                            Discord
                        </a>
                        <span className="hidden md:inline">|</span>
                        <a
                            href="https://finaloutpost.net/lab/lyricism"
                            className="hover:underline"
                        >
                            My Lab
                        </a>
                    </div>
                    {mounted && (
                        <div className="flex items-center justify-end py-2">
                            <Label
                                htmlFor="theme-switch"
                                className="dark:text-pompaca-purple text-barely-lilac"
                            >
                                <Sun className="h-4 w-4" />
                            </Label>
                            <Switch
                                id="theme-switch"
                                defaultValue={
                                    theme === 'system' ? undefined : theme
                                }
                                checked={theme === 'dark'}
                                onChange={() =>
                                    setTheme(
                                        theme === 'dark' ? 'light' : 'dark'
                                    )
                                }
                                color="custom"
                                size="medium"
                            />
                            <Label
                                htmlFor="theme-switch"
                                className="dark:text-pompaca-purple  text-barely-lilac"
                            >
                                <Moon className="h-4 w-4" />
                            </Label>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
}
