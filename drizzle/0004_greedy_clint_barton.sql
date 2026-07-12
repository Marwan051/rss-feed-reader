ALTER TABLE `feeds` ADD `last_fetched_at` text;--> statement-breakpoint
CREATE INDEX `items_pub_date_idx` ON `items` (`pub_date`);