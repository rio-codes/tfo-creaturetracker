import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { MessagesClientLayout } from './messages-client-layout';

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    return <MessagesClientLayout>{children}</MessagesClientLayout>;
}
