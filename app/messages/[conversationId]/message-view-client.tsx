'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { SendHorizonal, ArrowLeft } from 'lucide-react';

import { type MessageWithSender, type EnrichedConversation } from '@/lib/definitions';
import { getRandomCapsuleAvatar } from '@/lib/avatars';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';

async function fetchMessages(conversationId: string): Promise<MessageWithSender[]> {
    const res = await fetch(`/api/messages?conversationId=${conversationId}`);
    if (!res.ok) {
        throw new Error('Failed to fetch messages');
    }
    const data = await res.json();
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
                        ? 'bg-dusk-purple dark:bg-pompaca-purple dark:text-barely-lilac text-barely-lilac hallowsnight:bg-ruzafolio-scarlet hallowsnight:text-cimo-crimson'
                        : 'bg-ebena-lavender text-pompaca-purple dark:bg-pompaca-purple/70 dark:text-deep-purple hallowsnight:bg-ruzafolio-scarlet/50 hallowsnight:text-cimo-crimson/75'
                }`}
            >
                <p className="text-sm text-pompaca-purple dark:text-barely-lilac hallowsnight:text-blood-bay-wine">
                    {message.content}
                </p>
                <p
                    className={`text-xs mt-1 ${isOwnMessage ? 'text-pompaca-purple dark:text-barely-lilac hallowsnight:text-abyss' : 'text-dusk-purple hallowsnight:text-abyss'}`}
                >
                    {format(message.createdAt, 'P, p')}
                </p>
            </div>
        </div>
    );
}

interface MessageViewClientProps {
    conversationId: string;
    initialMessages: MessageWithSender[];
    initialConversation: EnrichedConversation;
}

export function MessageViewClient({
    conversationId,
    initialMessages,
    initialConversation,
}: MessageViewClientProps) {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState('');

    const { data: messages, isPending: isMessagesPending } = useQuery<MessageWithSender[]>({
        queryKey: ['messages', conversationId],
        queryFn: () => fetchMessages(conversationId),
        initialData: initialMessages,
        initialDataUpdatedAt: Date.now(),
        staleTime: 1000 * 60,
    });

    const { data: conversation, isPending: isConversationPending } = useQuery<EnrichedConversation>(
        {
            queryKey: ['conversation', conversationId],
            queryFn: () => Promise.resolve(initialConversation),
            initialData: initialConversation,
            staleTime: 1000 * 60 * 5,
        }
    );

    const sendMessageMutation = useMutation({
        mutationFn: (content: string) =>
            fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, content }),
            }),
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (error) => {
            console.error('Failed to send message:', error);
        },
    });

    const scrollToBottom = () => {
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
            // For a simple div, we can just set scrollTop to scrollHeight
            scrollArea.scrollTop = scrollArea.scrollHeight;
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
        if (newMessage.trim() && !sendMessageMutation.isPending) {
            sendMessageMutation.mutate(newMessage.trim());
        }
    };

    const otherParticipant = conversation?.otherParticipants[0];

    return (
        <div className="flex flex-col h-full bg-barely-lilac dark:bg-dusk-purple hallowsnight:bg-blood-bay-wine text-pompaca-purple dark:text-deep-purple hallowsnight:text-cimo-crimson">
            {/* Header */}
            <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <Link href="/messages" className="md:hidden mr-4">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                {isConversationPending ? (
                    <Skeleton className="h-8 w-48" />
                ) : otherParticipant ? (
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
                ) : null}
            </header>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef}>
                <div className="space-y-4 ">
                    {isMessagesPending ? (
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
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 resize-none hallowsnight:text-cimo-crimson/70 placeholder:text-pompaca-purple dark:placeholder:text-barely-lilac hallowsnight:placeholder:text-cimo-crimson/70"
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
