CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`secret_hash` blob NOT NULL,
	`user_id` integer NOT NULL,
	`last_used_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_index` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_last_used_at_index` ON `sessions` (`last_used_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`name` text,
	`role` text NOT NULL,
	`password_hash` text NOT NULL,
	`must_change_password` integer NOT NULL,
	`consented_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);