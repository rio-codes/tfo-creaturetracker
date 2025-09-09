'use client';

import { useState, useEffect } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

type Props = {
    goalId: string;
};

export function ShareGoalButton({ goalId }: Props) {
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    useEffect(() => {
        // Ensure window is defined, making it safe for SSR
        setShareUrl(`${window.location.origin}/share/goals/${goalId}`);
    }, [goalId]);

    const handleCopy = async () => {
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2 p-2 border rounded-lg bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50 shadow-sm">
            <Share2 className="h-5 w-5 text-pompaca-purple dark:text-purple-300" />
            <input
                type="text"
                value={shareUrl}
                readOnly
                className="text-sm bg-barely-lilac dark:bg-midnight-purple p-2 rounded border border-pompaca-purple/50 w-72 text-pompaca-purple dark:text-purple-300"
            />
            <button
                onClick={handleCopy}
                title="Copy link"
                className="p-2 hover:bg-pompaca-purple/10 dark:hover:bg-midnight-purple rounded-md transition-colors"
            >
                {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                ) : (
                    <Copy className="h-5 w-5 text-pompaca-purple dark:text-purple-300" />
                )}
            </button>
        </div>
    );
}
