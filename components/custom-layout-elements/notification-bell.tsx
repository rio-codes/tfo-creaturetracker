'use client';

import { Bell, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotificationStore, type Notification } from '@/hooks/use-notification-store';
import { useRouter } from 'next/navigation';

async function markNotificationsAsRead(markAllAsRead: () => void) {
    markAllAsRead(); // Optimistic update
    try {
        await fetch('/api/notifications', { method: 'PATCH' });
    } catch (error) {
        console.error('Failed to mark notifications as read:', error);
        // Here you might want to revert the optimistic update on failure
    }
}

function NotificationItem({ notification }: { notification: Notification }) {
    const router = useRouter();
    const Icon = notification.type === 'new_message' ? Mail : Bell;
    const sender = (notification.data as any)?.senderUsername || 'System';
    const content = (notification.data as any)?.messageContent || 'You have a new notification.';

    const handleClick = () => {
        if (notification.link) {
            router.push(notification.link);
        }
    };

    return (
        <DropdownMenuItem className="flex items-start gap-3 cursor-pointer" onClick={handleClick}>
            <Icon className="h-4 w-4 mt-1 text-pompaca-purple dark:text-purple-300" />
            <div className="flex flex-col">
                <p className="text-sm font-semibold">New message from {sender}</p>
                <p className="text-xs text-dusk-purple dark:text-purple-400 truncate">
                    {content.substring(0, 40)}...
                </p>
            </div>
        </DropdownMenuItem>
    );
}

export function NotificationBell() {
    const { notifications, unreadCount, markAllAsRead } = useNotificationStore();

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && unreadCount > 0) {
            markNotificationsAsRead(markAllAsRead);
        }
    };

    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-barely-lilac hallowsnight:text-cimo-crimson/75 hover:bg-dusk-purple hallowsnight:hover:bg-cimo-crimson focus-visible:ring-1 focus-visible:ring-ring rounded-md"
                >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Open notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-dusk-purple"
            >
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications
                        .slice(0, 5)
                        .map((n) => <NotificationItem key={n.id} notification={n} />)
                ) : (
                    <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
