'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserMinus, UserCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { friendshipStatusEnum } from '@/src/db/schema';

type FriendshipStatus = (typeof friendshipStatusEnum.enumValues)[number] | null;

interface FriendshipButtonProps {
    profileUserId: string;
    initialStatus: FriendshipStatus;
    actionUserId: string | null;
    sessionUserId: string | null;
}

export function FriendshipButton({
    profileUserId,
    initialStatus,
    actionUserId,
    sessionUserId,
}: FriendshipButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    if (!sessionUserId || sessionUserId === profileUserId) {
        return null; // Don't show button on own profile or if not logged in
    }

    const handleAction = async (action: 'request' | 'accept' | 'remove' | 'cancel') => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/friends/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: profileUserId, action }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong.');
            }

            router.refresh();
            toast.success(data.message || 'Success!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const isRequestSentByMe = initialStatus === 'pending' && actionUserId === sessionUserId;
    const isRequestReceivedByMe = initialStatus === 'pending' && actionUserId !== sessionUserId;

    if (initialStatus === 'accepted') {
        return (
            <Button
                onClick={() => handleAction('remove')}
                disabled={isLoading}
                variant="destructive"
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <UserMinus className="mr-2 h-4 w-4" />
                )}
                Unfriend
            </Button>
        );
    }

    if (isRequestSentByMe) {
        return (
            <Button onClick={() => handleAction('cancel')} disabled={isLoading} variant="secondary">
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Clock className="mr-2 h-4 w-4" />
                )}
                Request Sent
            </Button>
        );
    }

    if (isRequestReceivedByMe) {
        return (
            <div className="flex gap-2">
                <Button onClick={() => handleAction('accept')} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <UserCheck className="mr-2 h-4 w-4" />
                    )}
                    Accept
                </Button>
                <Button
                    onClick={() => handleAction('remove')}
                    disabled={isLoading}
                    variant="destructive"
                >
                    Decline
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={() => handleAction('request')}
            disabled={isLoading}
            className="bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <UserPlus className="mr-2 h-4 w-4" />
            )}
            Add Friend
        </Button>
    );
}
