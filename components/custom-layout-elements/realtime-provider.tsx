'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNotificationStore, type Notification } from '@/hooks/use-notification-store';

function showNewMessageToast(notification: Notification) {
    const sender = (notification.data as any)?.senderUsername || 'Someone';
    toast.info(`New message from ${sender}`, {
        description: (notification.data as any)?.messageContent.substring(0, 50) + '...',
        action: {
            label: 'View',
            onClick: () => {
                if (notification.link) {
                    window.location.href = notification.link;
                }
            },
        },
    });
}

export function RealtimeProvider() {
    const { data: session } = useSession();
    const { setInitialState, addNotification } = useNotificationStore();
    const isInitialized = useRef(false);

    useEffect(() => {
        if (session?.user?.id && !isInitialized.current) {
            isInitialized.current = true;
            const fetchInitialNotifications = async () => {
                try {
                    const res = await fetch('/api/notifications');
                    if (res.ok) {
                        const data: Notification[] = await res.json();
                        setInitialState(data);
                    }
                } catch (error) {
                    console.error('Failed to fetch initial notifications:', error);
                }
            };
            fetchInitialNotifications();
        }
    }, [session?.user?.id, setInitialState]);

    useEffect(() => {
        if (!session?.user?.id) return;

        const channel = supabase.channel(`user-notifications:${session.user.id}`);

        channel
            .on('broadcast', { event: 'new_notification' }, ({ payload }) => {
                console.log('New notification received:', payload);
                const newNotification = payload as Notification;

                addNotification(newNotification);

                if (newNotification.type === 'new_message') {
                    showNewMessageToast(newNotification);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Subscribed to user notification channel.');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id, addNotification]);

    return null;
}
