CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `cities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`country_code` text(2) NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`safety_rating` real NOT NULL,
	`official_status` text DEFAULT 'unknown' NOT NULL,
	`ph_level` real,
	`chlorine_level` real,
	`hardness` text,
	`tds` integer,
	`water_source` text,
	`treatment_process` text,
	`local_advice` text,
	`avg_taste_rating` real DEFAULT 0,
	`avg_safety_rating` real DEFAULT 0,
	`review_count` integer DEFAULT 0,
	`data_source` text,
	`last_updated` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE INDEX `country_idx` ON `cities` (`country`);--> statement-breakpoint
CREATE INDEX `safety_idx` ON `cities` (`safety_rating`);--> statement-breakpoint
CREATE INDEX `geo_idx` ON `cities` (`latitude`,`longitude`);--> statement-breakpoint
CREATE TABLE `helpful_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`review_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `helpful_review_user_idx` ON `helpful_votes` (`review_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`city_id` text NOT NULL,
	`user_id` text NOT NULL,
	`taste_rating` integer NOT NULL,
	`safety_rating` integer NOT NULL,
	`ph_level` real,
	`hardness` text,
	`water_source` text,
	`review_text` text,
	`visit_date` integer,
	`helpful_count` integer DEFAULT 0,
	`is_published` integer DEFAULT true,
	`is_flagged` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_city_idx` ON `reviews` (`city_id`);--> statement-breakpoint
CREATE INDEX `review_user_idx` ON `reviews` (`user_id`);--> statement-breakpoint
CREATE INDEX `review_created_idx` ON `reviews` (`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`email_verified` integer,
	`image` text,
	`review_count` integer DEFAULT 0,
	`is_verified` integer DEFAULT false,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL
);
