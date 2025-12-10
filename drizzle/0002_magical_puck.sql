ALTER TABLE `reviews` ADD `latitude` real NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `longitude` real NOT NULL;--> statement-breakpoint
CREATE INDEX `review_geo_idx` ON `reviews` (`latitude`,`longitude`);