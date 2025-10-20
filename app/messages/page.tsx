import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
    return (
        <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-24 h-24 mb-4" />
            <h2 className="text-2xl font-semibold">Select a conversation</h2>
            <p>Choose from your existing conversations or start a new one.</p>
        </div>
    );
}
