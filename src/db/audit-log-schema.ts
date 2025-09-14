import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './schema'; // Make sure this import points to your existing users table

export const auditLog = pgTable('audit_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
    adminId: uuid('admin_id').references(() => users.id, {
        onDelete: 'set null',
    }),
    adminUsername: text('admin_username'),
    action: text('action').notNull(), // e.g., 'user.suspend', 'pair.delete'
    targetType: text('target_type'),
    targetId: text('target_id'),
    details: jsonb('details'), // For storing before/after states or other context
});
