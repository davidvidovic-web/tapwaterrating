import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const cities = sqliteTable(
  "cities",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    country: text("country").notNull(),
    countryCode: text("country_code", { length: 2 }).notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    safetyRating: real("safety_rating").notNull(),
    officialStatus: text("official_status", {
      enum: ["safe", "caution", "unsafe", "unknown"],
    })
      .notNull()
      .default("unknown"),
    phLevel: real("ph_level"),
    chlorineLevel: real("chlorine_level"),
    hardness: text("hardness", {
      enum: ["soft", "medium", "hard", "very-hard"],
    }),
    tds: integer("tds"),
    waterSource: text("water_source"),
    treatmentProcess: text("treatment_process"),
    localAdvice: text("local_advice"),
    avgTasteRating: real("avg_taste_rating").default(0),
    avgSafetyRating: real("avg_safety_rating").default(0),
    reviewCount: integer("review_count").default(0),
    dataSource: text("data_source"),
    lastUpdated: integer("last_updated", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    countryIdx: index("country_idx").on(table.country),
    safetyIdx: index("safety_idx").on(table.safetyRating),
    geoIdx: index("geo_idx").on(table.latitude, table.longitude),
  })
);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  reviewCount: integer("review_count").default(0),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date()
  ),
});

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
  })
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").primaryKey(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    tasteRating: integer("taste_rating").notNull(),
    safetyRating: integer("safety_rating").notNull(),
    phLevel: real("ph_level"),
    hardness: text("hardness", {
      enum: ["soft", "medium", "hard", "very-hard"],
    }),
    waterSource: text("water_source"),
    treatmentProcess: text("treatment_process"),
    reviewText: text("review_text"),
    visitDate: integer("visit_date", { mode: "timestamp_ms" }),
    helpfulCount: integer("helpful_count").default(0),
    isPublished: integer("is_published", { mode: "boolean" }).default(true),
    isFlagged: integer("is_flagged", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    cityIdx: index("review_city_idx").on(table.cityId),
    userIdx: index("review_user_idx").on(table.userId),
    createdIdx: index("review_created_idx").on(table.createdAt),
    geoIdx: index("review_geo_idx").on(table.latitude, table.longitude),
  })
);

export const helpfulVotes = sqliteTable(
  "helpful_votes",
  {
    id: text("id").primaryKey(),
    reviewId: text("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    reviewUserIdx: index("helpful_review_user_idx").on(table.reviewId, table.userId),
  })
);

export type City = typeof cities.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type User = typeof users.$inferSelect;
