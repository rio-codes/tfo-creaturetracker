import {
    pgTable,
    text,
    integer,
    boolean,
    timestamp,
    jsonb,
    pgEnum,
    uniqueIndex,
    primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "@auth/core/adapters";

export const users = pgTable("user", {
    id: text("id").notNull().primaryKey(),
    name: text("name"),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
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
    isTfoVerified: boolean("is_tfo_verified").default(false).notNull(),
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

// Account Management
export const passwordResetTokens = pgTable("password_reset_token", {
    email: text("email").notNull().primaryKey(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const accountVerifications = pgTable("account_verification", {
    userId: text("user_id").notNull().primaryKey().references(() => users.id, { onDelete: "cascade" }),
    creatureCode: text("creature_code").notNull(),
    verificationToken: text("verification_token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
});

export const pendingRegistrations = pgTable("pending_registration", {
    email: text("email").notNull().primaryKey(),
    tfoUsername: text("tfo_username").notNull(),
    hashedPassword: text("hashed_password").notNull(),
    creatureCode: text("creature_code").notNull(),
    verificationToken: text("verification_token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
});

// Creature Functionality
export const creatureGenderEnum = pgEnum("gender", ["male", "female", "genderless", "unknown"]);

export const creatures = pgTable(
    "creature",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        code: text("code").notNull(),
        creatureName: text("name"),
        imageUrl: text("imgsrc").notNull(),
        gottenAt: timestamp("gotten_at", { mode: "date" }),
        growthLevel: integer("growth_level"),
        isStunted: boolean("is_stunted").default(false),
        species: text("breed_name"),
        genetics: text("genetics"),
        gender: creatureGenderEnum("gender"),
        isPinned: boolean("is_pinned").default(false).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => {
        return {
            userCreatureCodeIndex: uniqueIndex("user_creature_code_idx").on(
                table.userId,
                table.code
            ),
        };
    }
);

export const researchGoals = pgTable("research_goal", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    species: text("species").notNull(),
    imageUrl: text("image_url"),
    genes: jsonb("genes").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const breedingPairs = pgTable("breeding_pair", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    pairName: text("pair_name").notNull(),
    species: text("species").notNull(),
    maleParentId: text("male_parent_id")
        .notNull()
        .references(() => creatures.id, { onDelete: "cascade" }),
    femaleParentId: text("female_parent_id")
        .notNull()
        .references(() => creatures.id, { onDelete: "cascade" }),
    assignedGoalIds: jsonb("assigned_goal_ids").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const breedingLogEntries = pgTable("breeding_log_entry", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    pairId: text("pair_id")
        .notNull()
        .references(() => breedingPairs.id, { onDelete: "cascade" }),
    progeny1Id: text("progeny_1_id").references(() => creatures.id, {
        onDelete: "set null",
    }),
    progeny2Id: text("progeny_2_id").references(() => creatures.id, {
        onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const breedingPairsRelations = relations(breedingPairs, ({ one }) => ({
    maleParent: one(creatures, {
        fields: [breedingPairs.maleParentId],
        references: [creatures.id],
    }),
    femaleParent: one(creatures, {
        fields: [breedingPairs.femaleParentId],
        references: [creatures.id],
    }),
}));

export const achievedGoals = pgTable("achieved_goal", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    goalId: text("goal_id")
        .notNull()
        .references(() => researchGoals.id, { onDelete: "cascade" }),
    logEntryId: text("log_entry_id")
        .notNull()
        .references(() => breedingLogEntries.id, { onDelete: "cascade" }),
    matchingProgenyId: text("matching_progeny_id")
        .notNull()
        .references(() => creatures.id, { onDelete: "cascade" }),
    achievedAt: timestamp("achieved_at").defaultNow().notNull(),
});