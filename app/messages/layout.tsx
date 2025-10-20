import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ConversationList } from '@/app/messages/conversation-list';

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto h-[calc(100vh-120px)] flex">
            {/* Conversation List (Left Pane) */}
            <aside className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700">
                <ConversationList />
            </aside>

            {/* Message View (Right Pane) */}
            <section className="hidden md:flex flex-col flex-1">{children}</section>
        </div>
    );
}
