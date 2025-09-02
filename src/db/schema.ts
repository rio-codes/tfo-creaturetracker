import { relations } from "drizzle-orm";
import type { AdapterAccount } from "@auth/core/adapters";
import {
    pgTable,
    text,
    primaryKey,
    integer,
    boolean,
    serial,
    jsonb,
    timestamp,
    uniqueIndex,
    pgEnum,
    index,
    uuid,
} from "drizzle-orm/pg-core";

export const auditLog = pgTable("audit_log", {
    id: uuid("id").defaultRandom().primaryKey(),
    timestamp: timestamp("timestamp", { withTimezone: true })
        .defaultNow()
        .notNull(),
    adminId: text("admin_id").references(() => users.id, {
        onDelete: "set null",
    }),
    adminUsername: text("admin_username"),
    action: text("action").notNull(), // e.g., 'user.suspend', 'pair.delete'
    targetType: text("target_type"),
    targetId: text("target_id"),
    details: jsonb("details"), // For storing before/after states or other context
});

export const goalModeEnum = pgEnum("goal_mode", ["genotype", "phenotype"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended"]);
export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);

export const users = pgTable("user", {
    id: text("id").notNull().primaryKey(),
    name: text("name"),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    password: text("password"),
    role: text("role").default("user").notNull(),
    status: userStatusEnum("status").default("active").notNull(),
    theme: themeEnum("theme").default("system").notNull(),
    collectionItemsPerPage: integer("collection_items_per_page")
        .default(12)
        .notNull(),
    goalsItemsPerPage: integer("goals_items_per_page").default(9).notNull(),
    pairsItemsPerPage: integer("pairs_items_per_page").default(10).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
        userIdx: index("account_userId_idx").on(account.userId),
    })
);

export const sessions = pgTable(
    "session",
    {
        sessionToken: text("sessionToken").notNull().primaryKey(),
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (session) => ({
        userIdx: index("session_userId_idx").on(session.userId),
    })
);

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
    userId: text("user_id")
        .notNull()
        .primaryKey()
        .references(() => users.id, { onDelete: "cascade" }),
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
export const creatureGenderEnum = pgEnum("gender", [
    "male",
    "female",
    "genderless",
    "unknown",
]);

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
            userIdx: index("creature_userId_idx").on(table.userId),
            speciesIdx: index("creature_species_idx").on(table.species),
            genderIdx: index("creature_gender_idx").on(table.gender),
            pinnedIdx: index("creature_pinned_idx").on(table.isPinned),
            createdIdx: index("creature_created_at_idx").on(table.createdAt),
        };
    }
);

export const researchGoals = pgTable(
    "research_goal",
    {
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
        assignedPairIds: jsonb("assigned_pair_ids").$type<string[]>(),
        isPinned: boolean("is_pinned").default(false).notNull(),
        goalMode: goalModeEnum("goal_mode").default("phenotype").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdx: index("goal_userId_idx").on(table.userId),
        speciesIdx: index("goal_species_idx").on(table.species),
        pinnedIdx: index("goal_pinned_idx").on(table.isPinned),
        createdIdx: index("goal_created_at_idx").on(table.createdAt),
    })
);

export const breedingPairs = pgTable(
    "breeding_pair",
    {
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
        isPinned: boolean("is_pinned").default(false).notNull(),
        outcomesPreviewUrl: text("outcomes_preview_url"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdx: index("pair_userId_idx").on(table.userId),
        maleParentIdx: index("pair_maleParentId_idx").on(table.maleParentId),
        femaleParentIdx: index("pair_femaleParentId_idx").on(
            table.femaleParentId
        ),
        speciesIdx: index("pair_species_idx").on(table.species),
        pinnedIdx: index("pair_pinned_idx").on(table.isPinned),
        createdIdx: index("pair_created_at_idx").on(table.createdAt),
    })
);

export const breedingLogEntries = pgTable(
    "breeding_log_entry",
    {
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
    },
    (table) => ({
        userIdx: index("log_userId_idx").on(table.userId),
        pairIdx: index("log_pairId_idx").on(table.pairId),
    })
);

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

export const researchGoalsRelations = relations(researchGoals, ({ many }) => ({
    // This is a placeholder for a true many-to-many relationship.
    // For now, we'll rely on the jsonb column.
}));

export const achievedGoals = pgTable(
    "achieved_goal",
    {
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
    },
    (table) => ({
        userIdx: index("achieved_goal_userId_idx").on(table.userId),
        goalIdx: index("achieved_goal_goalId_idx").on(table.goalId),
        logEntryIdx: index("achieved_goal_logEntryId_idx").on(table.logEntryId),
        progenyIdx: index("achieved_goal_progenyId_idx").on(
            table.matchingProgenyId
        ),
    })
);

export const userTabs = pgTable(
    "user_tabs",
    {
        id: serial("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        tabId: integer("tab_id").notNull(),
        tabName: text("tab_name"),
        isSyncEnabled: boolean("is_sync_enabled").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => {
        return {
            userTabUnique: uniqueIndex("user_tab_unique_idx").on(
                table.userId,
                table.tabId
            ),
        };
    }
);
