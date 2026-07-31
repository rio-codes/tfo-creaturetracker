'use client';

import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

export function ThemeSyncer() {
    const { data: session, status } = useSession();
    const { setTheme } = useTheme();
    const lastSyncedTheme = useRef<string | null>(null);

    useEffect(() => {
        if (status === 'authenticated') {
            const userTheme = session?.user?.theme;
            if (userTheme && userTheme !== lastSyncedTheme.current) {
                setTheme(userTheme);
                lastSyncedTheme.current = userTheme;
            }
        } else if (status === 'unauthenticated') {
            lastSyncedTheme.current = null;
        }
    }, [status, session?.user?.theme, setTheme]);

    return null; // This component does not render anything.
}
