'use client';

import { useState, useEffect } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import type { EnrichedResearchGoal } from '@/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Props = {
    goal: Pick<EnrichedResearchGoal, 'id'>;
};

export function ShareGoalButton({ goal }: Props) {
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    useEffect(() => {
        // Ensure window is defined, making it safe for SSR
        if (goal?.id) {
            setShareUrl(`${window.location.origin}/share/goals/${goal.id}`);
        }
    }, [goal?.id]);

    const handleCopy = async () => {
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareContent = (
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={shareUrl}
                readOnly
                className="text-sm bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss p-2 rounded border border-pompaca-purple/50 w-64 md:w-72 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson"
                onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
                onClick={handleCopy}
                title="Copy link"
                className="p-2 hover:bg-pompaca-purple/10 dark:hover:bg-midnight-purple rounded-md transition-colors flex-shrink-0 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson"
            >
                {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                ) : (
                    <Copy className="h-5 w-5 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson" />
                )}
            </button>
        </div>
    );

    return (
        <>
            {/* Desktop view */}
            <div className="hidden md:flex items-center gap-2 p-2 border rounded-lg bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50 shadow-sm">
                <Share2 className="h-5 w-5 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson flex-shrink-0" />
                {shareContent}
            </div>

            {/* Mobile view */}
            <div className="md:hidden">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-pompaca-purple/50 bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet"
                        >
                            <Share2 className="h-5 w-5 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50">
                        {shareContent}
                    </PopoverContent>
                </Popover>
            </div>
        </>
    );
}
