'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { format } from 'date-fns';
import { SendHorizonal } from 'lucide-react';

import { type MessageWithSender, type EnrichedConversation } from '@/lib/definitions';
import { getRandomCapsuleAvatar } from '@/lib/avatars';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';

async function fetchMessages(conversationId: string): Promise<MessageWithSender[]> {
    const res = await fetch(`/api/messages?conversationId=${conversationId}`);
    if (!res.ok) {
        throw new Error('Failed to fetch messages');
    }
    const data = await res.json();
    // Parse date strings into Date objects
    return data.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
    }));
}

function MessageItem({
    message,
    isOwnMessage,
}: {
    message: MessageWithSender;
    isOwnMessage: boolean;
}) {
    return (
        <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {!isOwnMessage && (
                <Image
                    src={message.sender.image || getRandomCapsuleAvatar(message.sender.id)}
                    alt={message.sender.username || 'Sender'}
                    width={32}
                    height={32}
                    className="rounded-full"
                />
            )}
            <div
                className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                    isOwnMessage
                        ? 'bg-pompaca-purple text-white hallowsnight:bg-ruzafolio-scarlet hallowsnight:text-cimo-crimson'
                        : 'bg-gray-200 dark:bg-gray-700'
                }`}
            >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-purple-200' : 'text-gray-500'}`}>
                    {format(message.createdAt, 'p')}
                </p>
            </div>
        </div>
    );
}

export default function MessageView({ params }: { params: { conversationId: string } }) {
    const { conversationId } = params;
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState('');

    const { data: messages, isLoading: isLoadingMessages } = useQuery<MessageWithSender[]>({
        queryKey: ['messages', conversationId],
        queryFn: () => fetchMessages(conversationId),
        staleTime: 1000 * 60, // 1 minute
        enabled: !!conversationId,
    });

    const { data: conversation } = useQuery<EnrichedConversation>({
        queryKey: ['conversation', conversationId],
        queryFn: async () => {
            // We can get the conversation details from the conversations list cache
            const conversations = queryClient.getQueryData<EnrichedConversation[]>([
                'conversations',
            ]);
            const convo = conversations?.find((c) => c.id === conversationId);
            if (convo) return convo;
            // Or fetch it individually if not found (less ideal)
            // For now, we'll rely on the cache.
            return Promise.reject('Conversation not found in cache');
        },
        enabled: !!conversationId,
    });

    const sendMessageMutation = useMutation({
        mutationFn: (content: string) =>
            fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, content }),
            }),
        onSuccess: () => {
            setNewMessage('');
            // No need to invalidate here, as we'll get a real-time update
        },
        onError: (error) => {
            console.error('Failed to send message:', error);
            // Optionally show a toast notification
        },
    });

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector(
                'div[data-radix-scroll-area-viewport]'
            );
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on('broadcast', { event: 'new_message' }, (payload) => {
                queryClient.setQueryData(
                    ['messages', conversationId],
                    (oldData: MessageWithSender[] | undefined) => {
                        if (!oldData) return [payload.payload];
                        // Avoid adding duplicates if the sender is the current user
                        if (oldData.some((m) => m.id === payload.payload.id)) return oldData;
                        return [...oldData, payload.payload];
                    }
                );
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, queryClient]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessageMutation.mutate(newMessage.trim());
        }
    };

    const otherParticipant = conversation?.otherParticipants[0];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                {otherParticipant ? (
                    <>
                        <Image
                            src={
                                otherParticipant.userImage ||
                                getRandomCapsuleAvatar(otherParticipant.userId)
                            }
                            alt={otherParticipant.username || 'User'}
                            width={40}
                            height={40}
                            className="rounded-full mr-3"
                        />
                        <h2 className="text-lg font-semibold">{otherParticipant.username}</h2>
                    </>
                ) : (
                    <Skeleton className="h-8 w-48" />
                )}
            </header>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {isLoadingMessages ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-2/3" />
                            <Skeleton className="h-16 w-1/2 self-end ml-auto" />
                            <Skeleton className="h-8 w-3/4" />
                        </div>
                    ) : (
                        messages?.map((msg) => (
                            <MessageItem
                                key={msg.id}
                                message={msg}
                                isOwnMessage={msg.senderId === session?.user?.id}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Input Form */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 resize-none"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <Button type="submit" disabled={sendMessageMutation.isPending}>
                        <SendHorizonal className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
