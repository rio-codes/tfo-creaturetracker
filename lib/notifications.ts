import { db } from '@/src/db';
import { notifications, type notificationTypeEnum } from '@/src/db/schema';
import { supabase } from './supabase';

export type NotificationPayload = {
    recipientId: string;
    type: (typeof notificationTypeEnum.enumValues)[number];
    data: Record<string, any>;
    link?: string;
};

export async function createNotification(payload: NotificationPayload) {
    try {
        const [newNotification] = await db
            .insert(notifications)
            .values({
                recipientId: payload.recipientId,
                type: payload.type,
                data: payload.data,
                link: payload.link,
            })
            .returning();

        const channel = supabase.channel(`user-notifications:${payload.recipientId}`);
        const broadcastStatus = await channel.send({
            type: 'broadcast',
            event: 'new_notification',
            payload: newNotification,
        });

        if (broadcastStatus !== 'ok') {
            console.error('Failed to broadcast notification:', broadcastStatus);
        }

        // TODO: (Future) Send an email notification
        // const userPreferences = await getUserNotificationPreferences(payload.recipientId);
        // if (userPreferences.email) {
        //   await sendEmailNotification(newNotification);
        // }

        return newNotification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw new Error('Could not create notification.');
    }
}
