import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
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
  password: text("password"), // For credentials-based login
  role: text("role", { enum: ["user", "admin"] }).default("user"),
  reviewCount: integer("review_count").default(0),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date()
  ),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
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

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.identifier, table.token],
    }),
  })
);

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
    streetAddress: text("street_address"),
    locationName: text("location_name"),
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

// Content Management Tables
export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    parentId: text("parent_id"),
    order: integer("order").default(0),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    slugIdx: index("category_slug_idx").on(table.slug),
    parentIdx: index("category_parent_idx").on(table.parentId),
  })
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    color: text("color"), // hex color for UI
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    slugIdx: index("tag_slug_idx").on(table.slug),
  })
);

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content").notNull(), // HTML/JSON content from Tiptap
    contentJson: text("content_json"), // JSON format for editing
    featuredImage: text("featured_image"),
    type: text("type", { enum: ["post", "page"] }).notNull().default("post"),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    viewCount: integer("view_count").default(0),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    slugIdx: index("post_slug_idx").on(table.slug),
    statusIdx: index("post_status_idx").on(table.status),
    authorIdx: index("post_author_idx").on(table.authorId),
    categoryIdx: index("post_category_idx").on(table.categoryId),
    publishedIdx: index("post_published_idx").on(table.publishedAt),
  })
);

export const postTags = sqliteTable(
  "post_tags",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.postId, table.tagId],
    }),
    tagIdx: index("post_tag_tag_idx").on(table.tagId),
  })
);

export type City = typeof cities.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostTag = typeof postTags.$inferSelect;
