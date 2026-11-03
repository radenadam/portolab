CREATE TABLE `classes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`lecturer_id` integer NOT NULL,
	`starting_cash` integer NOT NULL,
	`join_code` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lecturer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `classes_join_code_unique` ON `classes` (`join_code`);--> statement-breakpoint
CREATE INDEX `classes_lecturer_id_index` ON `classes` (`lecturer_id`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`class_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_class_id_student_id_unique` ON `memberships` (`class_id`,`student_id`);--> statement-breakpoint
CREATE INDEX `memberships_student_id_index` ON `memberships` (`student_id`);