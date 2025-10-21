'use client';

import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConversationList } from '@/app/messages/conversation-list';

export function MessagesClientLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const hasConversationId = !!params.conversationId;

    return (
        <div className="container mx-auto h-[calc(100vh-120px)] flex">
            {/* Conversation List (Left Pane) */}
            <aside
                className={cn(
                    'w-full border-r border-gray-200 dark:border-gray-700 md:w-1/3 lg:w-1/4',
                    hasConversationId && 'hidden md:block'
                )}
            >
                <ConversationList />
            </aside>

            {/* Message View (Right Pane) */}
            <section
                className={cn('flex-1 flex-col', hasConversationId ? 'flex' : 'hidden md:flex')}
            >
                {children}
            </section>
        </div>
    );
}
