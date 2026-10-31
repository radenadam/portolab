CREATE TABLE `index_quotes` (
	`code` text PRIMARY KEY NOT NULL,
	`level` real NOT NULL,
	`previous_level` real NOT NULL,
	`quoted_at` integer NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `price_updates` (
	`id` integer PRIMARY KEY NOT NULL,
	`attempted_at` integer NOT NULL,
	`succeeded` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock_quotes` (
	`code` text PRIMARY KEY NOT NULL,
	`price` integer NOT NULL,
	`previous_close` integer NOT NULL,
	`quoted_at` integer NOT NULL,
	`fetched_at` integer NOT NULL
);
