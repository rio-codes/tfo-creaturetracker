'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type MessageUserButtonProps = {
    profileUserId: string;
    prefillMessage?: string;
};

export function MessageUserButton({ profileUserId, prefillMessage }: MessageUserButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleMessage = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/conversations/find-or-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId: profileUserId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to start conversation.');
            }
            const { conversationId } = await res.json();
            let url = `/messages/${conversationId}`;
            if (prefillMessage) {
                url += `?prefill=${encodeURIComponent(prefillMessage)}`;
            }
            router.push(url);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'An unknown error occurred.';
            toast.error('Could not start conversation', {
                description: errorMessage,
            });
            setIsLoading(false);
        }
    };

    return (
        <Button
            className=" bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson"
            onClick={handleMessage}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Mail className="mr-2 h-4 w-4" />
            )}
            <span>Message</span>
        </Button>
    );
}
