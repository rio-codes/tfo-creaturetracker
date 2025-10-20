'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

import { type EnrichedConversation } from '@/lib/definitions';
import { getRandomCapsuleAvatar } from '@/lib/avatars';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';

async function fetchConversations(): Promise<EnrichedConversation[]> {
    const res = await fetch('/api/conversations');
    if (!res.ok) {
        throw new Error('Failed to fetch conversations');
    }
    const data = await res.json();
    // Parse date strings into Date objects
    return data.map((convo: any) => ({
        ...convo,
        lastMessage: convo.lastMessage
            ? { ...convo.lastMessage, createdAt: new Date(convo.lastMessage.createdAt) }
            : null,
    }));
}

function ConversationItem({ conversation }: { conversation: EnrichedConversation }) {
    const params = useParams();
    const isActive = params.conversationId === conversation.id;

    const otherParticipant = conversation.otherParticipants[0];
    if (!otherParticipant) return null;

    const lastMessage = conversation.lastMessage;

    return (
        <Link
            href={`/messages/${conversation.id}`}
            className={cn(
                'flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg',
                isActive && 'bg-gray-200 dark:bg-gray-700'
            )}
        >
            <Image
                src={otherParticipant.userImage || getRandomCapsuleAvatar(otherParticipant.userId)}
                alt={otherParticipant.username || 'User'}
                width={40}
                height={40}
                className="rounded-full mr-3"
            />
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">{otherParticipant.username}</p>
                    {lastMessage && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatDistanceToNow(lastMessage.createdAt, { addSuffix: true })}
                        </p>
                    )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {lastMessage?.content || 'No messages yet'}
                </p>
            </div>
        </Link>
    );
}

export function ConversationList() {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const { data: conversations, isLoading } = useQuery<EnrichedConversation[]>({
        queryKey: ['conversations'],
        queryFn: fetchConversations,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Listen for new messages to update the conversation list
    useEffect(() => {
        if (!session?.user?.id) return;

        const channel = supabase
            .channel('user-notifications:' + session.user.id)
            .on('broadcast', { event: 'new_notification' }, (payload) => {
                const notification = payload.payload;
                if (notification.type === 'new_message') {
                    // Refetch conversations to get the latest message and order
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    // Also refetch the specific conversation if it's open
                    queryClient.invalidateQueries({
                        queryKey: ['messages', notification.data.conversationId],
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id, queryClient]);

    if (isLoading) {
        return (
            <div className="p-2 space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold p-4 border-b border-gray-200 dark:border-gray-700">
                Messages
            </h2>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {conversations && conversations.length > 0 ? (
                        conversations.map((convo) => (
                            <ConversationItem key={convo.id} conversation={convo} />
                        ))
                    ) : (
                        <p className="p-4 text-center text-gray-500">No conversations yet.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
