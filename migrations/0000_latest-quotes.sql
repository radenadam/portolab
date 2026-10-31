CREATE TABLE `latest_quotes` (
	`code` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`price` real NOT NULL,
	`previous_close` real NOT NULL,
	`quoted_at` integer NOT NULL,
	`fetched_at` integer NOT NULL
);
