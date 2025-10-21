'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function MessageUserButton({ profileUserId }: { profileUserId: string }) {
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
            router.push(`/messages/${conversationId}`);
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
        <Button onClick={handleMessage} disabled={isLoading} className="w-full">
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Mail className="mr-2 h-4 w-4" />
            )}
            <span>Message</span>
        </Button>
    );
}
