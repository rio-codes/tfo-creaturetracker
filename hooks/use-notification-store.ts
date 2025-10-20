import { create } from 'zustand';
import type { notifications } from '@/src/db/schema';

export type Notification = typeof notifications.$inferSelect;

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    setInitialState: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,
    setInitialState: (notifications) =>
        set({
            notifications,
            unreadCount: notifications.filter((n) => !n.isRead).length,
        }),
    addNotification: (notification) =>
        set((state) => ({
            // Add new notifications to the top and prevent duplicates
            notifications: [
                notification,
                ...state.notifications.filter((n) => n.id !== notification.id),
            ],
            unreadCount: state.unreadCount + 1,
        })),
    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
        })),
}));
