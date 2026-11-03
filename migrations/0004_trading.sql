CREATE TABLE `holdings` (
	`membership_id` integer NOT NULL,
	`code` text NOT NULL,
	`shares` integer NOT NULL,
	`cost` integer NOT NULL,
	PRIMARY KEY(`membership_id`, `code`),
	FOREIGN KEY (`membership_id`) REFERENCES `portfolios`(`membership_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`membership_id` integer NOT NULL,
	`code` text NOT NULL,
	`side` text NOT NULL,
	`lots` integer NOT NULL,
	`limit` integer,
	`placed_at` integer NOT NULL,
	`shares` integer NOT NULL,
	`trading_day` text NOT NULL,
	`trades_from` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`checked_price` integer NOT NULL,
	`set_aside_cash` integer NOT NULL,
	`state` text NOT NULL,
	`ended_at` integer,
	`quoted_at` integer,
	`trade_price` integer,
	`trade_value` integer,
	`trade_fee` integer,
	`trade_tax` integer,
	`failure` text,
	`available_cash` integer,
	`held_lots` integer,
	`set_aside_lots` integer,
	`set_aside_orders` integer,
	FOREIGN KEY (`membership_id`) REFERENCES `portfolios`(`membership_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `orders_membership_id_index` ON `orders` (`membership_id`);--> statement-breakpoint
CREATE INDEX `orders_state_index` ON `orders` (`state`);--> statement-breakpoint
CREATE TABLE `portfolios` (
	`membership_id` integer PRIMARY KEY NOT NULL,
	`cash` integer NOT NULL,
	FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON UPDATE no action ON DELETE cascade
);
