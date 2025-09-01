"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

/**
 * This component is responsible for syncing the user's theme preference
 * from the database (via the session) to the client-side `next-themes` state.
 * This ensures that if a user logs in on a new device, their saved theme is applied.
 */
export function ThemeSyncer() {
    const { data: session, status } = useSession();
    const { setTheme } = useTheme();
    const hasSynced = useRef(false);

    useEffect(() => {
        // Only sync if we have an authenticated session and haven't synced for this session yet.
        if (status === "authenticated" && !hasSynced.current) {
            const userTheme = session?.user?.theme;
            if (userTheme) {
                setTheme(userTheme);
                hasSynced.current = true; // Mark as synced for this session.
            }
        }
        // If the user logs out, reset the flag so it can sync again on the next login.
        if (status === "unauthenticated") {
            hasSynced.current = false;
        }
    }, [status, session?.user?.theme, setTheme]);

    return null; // This component does not render anything.
}