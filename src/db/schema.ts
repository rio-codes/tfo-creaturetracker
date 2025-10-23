import { relations } from 'drizzle-orm';
import type { AdapterAccount } from 'next-auth/adapters';
import {
    timestamp,
    pgTable,
    text,
    primaryKey,
    varchar,
    boolean,
    jsonb,
    pgEnum,
    integer,
    uuid,
    index,
    uniqueIndex,
    serial,
    foreignKey,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const conversations = pgTable('conversations', {
    id: varchar('id', { length: 255 })
        .$defaultFn(() => createId())
        .primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const participants = pgTable(
    'participants',
    {
        userId: varchar('user_id', { length: 255 })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        conversationId: varchar('conversation_id', { length: 255 })
            .notNull()
            .references(() => conversations.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [primaryKey({ columns: [table.userId, table.conversationId] })]
);

export const messages = pgTable('messages', {
    id: varchar('id', { length: 255 })
        .$defaultFn(() => createId())
        .primaryKey(),
    conversationId: varchar('conversation_id', { length: 255 })
        .notNull()
        .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: varchar('sender_id', { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
}));

export const notificationTypeEnum = pgEnum('notification_type', ['new_message', 'friend_request']);

export const notifications = pgTable('notifications', {
    id: varchar('id', { length: 255 })
        .$defaultFn(() => createId())
        .primaryKey(),
    recipientId: varchar('recipient_id', { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    data: jsonb('data').notNull(),
    link: varchar('link', { length: 255 }), // URL to navigate to on click
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = pgTable('audit_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
    adminId: text('admin_id').references(() => users.id, {
        onDelete: 'set null',
    }),
    adminUsername: text('admin_username'),
    action: text('action').notNull(), // e.g., 'user.suspend', 'pair.delete'
    targetType: text('target_type'),
    targetId: text('target_id'),
    targetUserId: text('target_user_id'),
    targetUsername: text('target_username'),
    details: jsonb('details'), // For storing before/after states or other context
});

export const goalModeEnum = pgEnum('goal_mode', ['genotype', 'phenotype']);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended']);
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'blocked']);
export const themeEnum = pgEnum('theme', ['light', 'dark', 'system', 'hallowsnight']);

export const users = pgTable('user', {
    id: text('id').notNull().primaryKey(),
    name: text('name'),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    emailVerified: timestamp('emailVerified', { mode: 'date' }),
    image: text('image'),
    password: text('password'),
    role: userRoleEnum('role').default('user').notNull(),
    status: userStatusEnum('status').default('active').notNull(),
    theme: themeEnum('theme').default('system').notNull(),
    collectionItemsPerPage: integer('collection_items_per_page').default(12).notNull(),
    goalsItemsPerPage: integer('goals_items_per_page').default(9).notNull(),
    pairsItemsPerPage: integer('pairs_items_per_page').default(10).notNull(),
    apiKey: text('api_key').unique(),
    tutorialProgress: integer('tutorial_progress').default(-1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    bio: text('bio'),
    supporterTier: text('supporter_tier', {
        enum: ['admin', 'beta_tester', 'researcher', 'postdoc', 'assoc_prof', 'tenured_prof'],
    })
        .default('researcher')
        .notNull(),
    featuredCreatureIds: jsonb('featured_creature_ids').$type<string[]>(),
    featuredGoalIds: jsonb('featured_goal_ids').$type<string[]>(),
    pronouns: text('pronouns'),
    socialLinks: jsonb('social_links').$type<string[]>(),
    showLabLink: boolean('show_lab_link').default(true).notNull(),
    statusMessage: text('status_message'),
    statusEmoji: text('status_emoji'),
    showStats: boolean('show_stats').default(true).notNull(),
    showFriendsList: boolean('show_friends_list').default(true).notNull(),
    preserveFilters: boolean('preserve_filters').default(false).notNull(),
    showFulfillable: boolean('show_fulfillable').default(false).notNull(),
});

export const accounts = pgTable(
    'account',
    {
        userId: text('userId')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: text('type').$type<AdapterAccount['type']>().notNull(),
        provider: text('provider').notNull(),
        providerAccountId: text('providerAccountId').notNull(),
        refresh_token: text('refresh_token'),
        access_token: text('access_token'),
        expires_at: integer('expires_at'),
        token_type: text('token_type'),
        scope: text('scope'),
        id_token: text('id_token'),
        session_state: text('session_state'),
        isTfoVerified: boolean('is_tfo_verified').default(false).notNull(),
    },
    (account) => [
        primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
        index('account_userId_idx').on(account.userId),
    ]
);

export const sessions = pgTable(
    'session',
    {
        sessionToken: text('sessionToken').notNull().primaryKey(),
        userId: text('userId')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        expires: timestamp('expires', { mode: 'date' }).notNull(),
    },
    (session) => [index('session_userId_idx').on(session.userId)]
);

export const verificationTokens = pgTable(
    'verificationToken',
    {
        identifier: text('identifier').notNull(),
        token: text('token').notNull(),
        expires: timestamp('expires', { mode: 'date' }).notNull(),
    },
    (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export const passwordResetTokens = pgTable('password_reset_token', {
    email: text('email').notNull().primaryKey(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const friendships = pgTable(
    'friendships',
    {
        userOneId: text('user_one_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        userTwoId: text('user_two_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        status: friendshipStatusEnum('status').notNull(),
        actionUserId: text('action_user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
    },
    (t) => [
        primaryKey({ columns: [t.userOneId, t.userTwoId] }),
        index('friendship_userOne_idx').on(t.userOneId),
        index('friendship_userTwo_idx').on(t.userTwoId),
    ]
);

export const accountVerifications = pgTable('account_verification', {
    userId: text('user_id')
        .notNull()
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    creatureCode: text('creature_code').notNull(),
    verificationToken: text('verification_token').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
});

export const pendingRegistrations = pgTable('pending_registration', {
    email: text('email').notNull().primaryKey(),
    tfoUsername: text('tfo_username').notNull(),
    hashedPassword: text('hashed_password').notNull(),
    creatureCode: text('creature_code').notNull(),
    verificationToken: text('verification_token').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
});

export const creatureGenderEnum = pgEnum('gender', ['male', 'female', 'genderless', 'unknown']);
export const creatureOriginEnum = pgEnum('origin', [
    'cupboard',
    'genome-splicer',
    'another-lab',
    'quest',
    'raffle',
    'unknown',
    'bred',
]);

export const creatures = pgTable(
    'creature',
    {
        id: text('id')
            .notNull()
            .unique()
            .$defaultFn(() => createId()),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        code: text('code').notNull(),
        creatureName: text('name'),
        imageUrl: text('imgsrc').notNull(),
        gottenAt: timestamp('gotten_at', { mode: 'date' }),
        growthLevel: integer('growth_level'),
        isStunted: boolean('is_stunted').default(false),
        species: text('breed_name'),
        genetics: text('genetics'),
        gender: creatureGenderEnum('gender'),
        isPinned: boolean('is_pinned').default(false).notNull(),
        pinOrder: integer('pin_order'),
        isArchived: boolean('is_archived').default(false).notNull(),
        generation: integer('generation').default(1).notNull(),
        origin: creatureOriginEnum('origin').default('unknown'),
        fulfillsWish: boolean('fulfills_wish').default(false).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.userId, table.code] }),
        index('creature_userId_idx').on(table.userId),
        index('creature_species_idx').on(table.species),
        index('creature_gender_idx').on(table.gender),
        index('creature_pinned_idx').on(table.isPinned),
        index('creature_created_at_idx').on(table.createdAt),
    ]
);

export const creaturesRelations = relations(creatures, ({ one, many }) => ({
    user: one(users, {
        fields: [creatures.userId],
        references: [users.id],
    }),
    maleInPairs: many(breedingPairs, { relationName: 'maleParent' }),
    femaleInPairs: many(breedingPairs, { relationName: 'femaleParent' }),
    progenyInLogs1: many(breedingLogEntries, { relationName: 'progeny1' }),
    progenyInLogs2: many(breedingLogEntries, { relationName: 'progeny2' }),
    inAchievedGoals: many(achievedGoals),
}));

export const researchGoals = pgTable(
    'research_goals',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        species: text('species').notNull(),
        imageUrl: text('image_url'),
        genes: jsonb('genes').notNull().$type<{ [category: string]: GoalGene }>(),
        excludedGenes: jsonb('excluded_genes').$type<{
            [category: string]: { phenotype: string[] };
        }>(),
        assignedPairIds: jsonb('assigned_pair_ids').$type<string[]>(),
        isPinned: boolean('is_pinned').default(false).notNull(),
        pinOrder: integer('pin_order'),
        goalMode: goalModeEnum('goal_mode').default('phenotype').notNull(),
        isPublic: boolean('is_public').default(false).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => [
        index('goal_userId_idx').on(table.userId),
        index('goal_species_idx').on(table.species),
        index('goal_pinned_idx').on(table.isPinned),
        index('goal_created_at_idx').on(table.createdAt),
    ]
);

export const breedingPairs = pgTable(
    'breeding_pairs',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        pairName: text('pair_name').notNull(),
        species: text('species').notNull(),
        assignedGoalIds: jsonb('assigned_goal_ids').$type<string[]>(),
        maleParentUserId: text('male_parent_user_id').notNull(),
        maleParentCode: text('male_parent_code').notNull(),
        femaleParentUserId: text('female_parent_user_id').notNull(),
        femaleParentCode: text('female_parent_code').notNull(),
        isPinned: boolean('is_pinned').default(false).notNull(),
        pinOrder: integer('pin_order'),
        outcomesPreviewUrl: text('outcomes_preview_url'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
        isArchived: boolean('is_archived').default(false).notNull(),
    },
    (table) => [
        {
            userPairNameIndex: uniqueIndex('user_pair_name_idx').on(table.userId, table.pairName),
            maleParentFk: foreignKey({
                columns: [table.maleParentUserId, table.maleParentCode],
                foreignColumns: [creatures.userId, creatures.code],
            }).onDelete('cascade'),
            femaleParentFk: foreignKey({
                columns: [table.femaleParentUserId, table.femaleParentCode],
                foreignColumns: [creatures.userId, creatures.code],
            }).onDelete('cascade'),
            userIdx: index('pair_userId_idx').on(table.userId),
            maleParentIdx: index('pair_maleParentId_idx').on(table.maleParentCode),
            femaleParentIdx: index('pair_femaleParentId_idx').on(table.femaleParentCode),
            speciesIdx: index('pair_species_idx').on(table.species),
            pinnedIdx: index('pair_pinned_idx').on(table.isPinned),
            createdIdx: index('pair_created_at_idx').on(table.createdAt),
        },
    ]
);

export const breedingPairsRelations = relations(breedingPairs, ({ one, many }) => ({
    user: one(users, { fields: [breedingPairs.userId], references: [users.id] }),
    maleParent: one(creatures, {
        fields: [breedingPairs.maleParentUserId, breedingPairs.maleParentCode],
        references: [creatures.userId, creatures.code],
        relationName: 'maleParent',
    }),
    femaleParent: one(creatures, {
        fields: [breedingPairs.femaleParentUserId, breedingPairs.femaleParentCode],
        references: [creatures.userId, creatures.code],
        relationName: 'femaleParent',
    }),
    logs: many(breedingLogEntries),
}));

export const breedingLogEntries = pgTable(
    'breeding_log_entries',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        pairId: text('pair_id')
            .notNull()
            .references(() => breedingPairs.id, { onDelete: 'cascade' }),
        progeny1UserId: text('progeny_1_user_id'),
        progeny1Code: text('progeny_1_code'),
        progeny2UserId: text('progeny_2_user_id'),
        progeny2Code: text('progeny_2_code'),
        notes: text('notes'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => [
        index('user_log_pair_idx').on(table.userId, table.pairId),
        index('log_pairId_idx').on(table.pairId),
        index('log_progeny1Id_idx').on(table.progeny1Code),
        index('log_progeny2Id_idx').on(table.progeny2Code),
        index('log_userId_idx').on(table.userId),
        foreignKey({
            columns: [table.progeny1UserId, table.progeny1Code],
            foreignColumns: [creatures.userId, creatures.code],
        }).onDelete('set null'),
        foreignKey({
            columns: [table.progeny2UserId, table.progeny2Code],
            foreignColumns: [creatures.userId, creatures.code],
        }).onDelete('set null'),
    ]
);

export const achievedGoals = pgTable(
    'achieved_goal',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        goalId: text('goal_id')
            .notNull()
            .references(() => researchGoals.id, { onDelete: 'cascade' }),
        logEntryId: text('log_entry_id')
            .notNull()
            .references(() => breedingLogEntries.id, { onDelete: 'cascade' }),
        matchingProgenyUserId: text('matching_progeny_user_id').notNull(),
        matchingProgenyCode: text('matching_progeny_code').notNull(),
        achievedAt: timestamp('achieved_at').defaultNow().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.matchingProgenyUserId, table.matchingProgenyCode],
            foreignColumns: [creatures.userId, creatures.code],
        }).onDelete('cascade'),
        index('achieved_goal_userId_idx').on(table.userId),
        index('achieved_goal_goalId_idx').on(table.goalId),
        index('achieved_goal_logEntryId_idx').on(table.logEntryId),
        index('achieved_goal_progenyId_idx').on(table.matchingProgenyCode),
    ]
);

export const achievedGoalsRelations = relations(achievedGoals, ({ one }) => ({
    user: one(users, { fields: [achievedGoals.userId], references: [users.id] }),
    goal: one(researchGoals, { fields: [achievedGoals.goalId], references: [researchGoals.id] }),
    logEntry: one(breedingLogEntries, {
        fields: [achievedGoals.logEntryId],
        references: [breedingLogEntries.id],
    }),
    matchingProgeny: one(creatures, {
        fields: [achievedGoals.matchingProgenyUserId, achievedGoals.matchingProgenyCode],
        references: [creatures.userId, creatures.code],
    }),
}));

export const userTabs = pgTable(
    'user_tabs',
    {
        id: serial('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tabId: integer('tab_id').notNull(),
        tabName: text('tab_name'),
        isSyncEnabled: boolean('is_sync_enabled').default(true).notNull(),
        displayOrder: integer('display_order').default(0).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex('user_tab_key').on(table.userId, table.tabId),
        index('user_tabs_userId_idx').on(table.userId),
        index('user_tabs_tabId_idx').on(table.tabId),
    ]
);

export const reports = pgTable('report', {
    id: uuid('id').defaultRandom().primaryKey(),
    reporterId: text('reporter_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    reportedId: text('reported_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    status: text('status', {
        enum: ['open', 'resolved', 'dismissed'],
    })
        .default('open')
        .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userActionLog = pgTable(
    'user_action_log',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
        action: text('action').notNull(), // e.g., 'goal.create', 'creature.archive'
        description: text('description').notNull(),
        link: text('link'), // e.g., '/research-goals/goal-id'
    },
    (table) => [
        index('user_action_log_userId_idx').on(table.userId),
        index('user_action_log_timestamp_idx').on(table.timestamp),
    ]
);
