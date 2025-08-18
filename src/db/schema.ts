import {
    pgTable,
    text,
    integer,
    boolean,
    timestamp,
    pgEnum,
    uniqueIndex,
    primaryKey
} from 'drizzle-orm/pg-core';
import type { AdapterAccount } from "@auth/core/adapters";

export const users = pgTable("user", {
    id: text("id").notNull().primaryKey(),
    name: text("name"),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    // If you want to add a password for a credentials provider
    password: text("password"), 
});

export const accounts = pgTable(
"account",
{
    userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
},
(account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
})
);

export const sessions = pgTable("session", {
sessionToken: text("sessionToken").notNull().primaryKey(),
userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
"verificationToken",
{
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
},
(vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
})
);

export const passwordResetTokens = pgTable("password_reset_token", {
    email: text("email").notNull().primaryKey(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const creatureGenderEnum = pgEnum('gender', ['male', 'female', 'genderless', 'unknown']);

export const creatures = pgTable('creature', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    
    // Foreign key to the user who owns this creature
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Core identifier from TFO
    code: text('code').notNull(),

    // TFO API Fields
    creatureName: text('name'), // Renamed to avoid conflict with table name property
    imageUrl: text('imgsrc').notNull(),
    gottenAt: timestamp('gotten_at', { mode: 'date' }),
    growthLevel: integer('growth_level'),
    isStunted: boolean('is_stunted').default(false),
    species: text('breed_name'),
    genetics: text('genetics'),
    gender: creatureGenderEnum('gender'),

    // Timestamps for your own tracking
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
    return {
        userCreatureCodeIndex: uniqueIndex('user_creature_code_idx').on(table.userId, table.code),
    };
});