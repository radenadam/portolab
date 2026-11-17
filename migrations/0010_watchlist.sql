CREATE TABLE `watchlist` (
	`user_id` integer NOT NULL,
	`code` text NOT NULL,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `code`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
