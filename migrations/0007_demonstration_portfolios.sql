CREATE TABLE `__new_portfolios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`membership_id` integer,
	`demonstration_class_id` integer,
	`cash` integer NOT NULL,
	FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`demonstration_class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "portfolios_one_owner" CHECK(("__new_portfolios"."membership_id" IS NOT NULL) != ("__new_portfolios"."demonstration_class_id" IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO `__new_portfolios`("id", "membership_id", "demonstration_class_id", "cash") SELECT "membership_id", "membership_id", NULL, "cash" FROM `portfolios`;
--> statement-breakpoint
CREATE TABLE `__new_holdings` (
	`portfolio_id` integer NOT NULL,
	`code` text NOT NULL,
	`shares` integer NOT NULL,
	`cost` integer NOT NULL,
	PRIMARY KEY(`portfolio_id`, `code`),
	FOREIGN KEY (`portfolio_id`) REFERENCES `__new_portfolios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_holdings`("portfolio_id", "code", "shares", "cost") SELECT "membership_id", "code", "shares", "cost" FROM `holdings`;
--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`portfolio_id` integer NOT NULL,
	`code` text NOT NULL,
	`side` text NOT NULL,
	`lots` integer NOT NULL,
	`limit` integer,
	`reason` text,
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
	FOREIGN KEY (`portfolio_id`) REFERENCES `__new_portfolios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "portfolio_id", "code", "side", "lots", "limit", "reason", "placed_at", "shares", "trading_day", "trades_from", "expires_at", "checked_price", "set_aside_cash", "state", "ended_at", "quoted_at", "trade_price", "trade_value", "trade_fee", "trade_tax", "failure", "available_cash", "held_lots", "set_aside_lots", "set_aside_orders") SELECT "id", "membership_id", "code", "side", "lots", "limit", "reason", "placed_at", "shares", "trading_day", "trades_from", "expires_at", "checked_price", "set_aside_cash", "state", "ended_at", "quoted_at", "trade_price", "trade_value", "trade_fee", "trade_tax", "failure", "available_cash", "held_lots", "set_aside_lots", "set_aside_orders" FROM `orders`;
--> statement-breakpoint
UPDATE `sqlite_sequence` SET `seq` = max(`seq`, coalesce((SELECT `seq` FROM `sqlite_sequence` WHERE `name` = 'orders'), 0)) WHERE `name` = '__new_orders';
--> statement-breakpoint
DROP TABLE `holdings`;
--> statement-breakpoint
DROP TABLE `orders`;
--> statement-breakpoint
DROP TABLE `portfolios`;
--> statement-breakpoint
ALTER TABLE `__new_portfolios` RENAME TO `portfolios`;
--> statement-breakpoint
ALTER TABLE `__new_holdings` RENAME TO `holdings`;
--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;
--> statement-breakpoint
CREATE INDEX `orders_portfolio_id_index` ON `orders` (`portfolio_id`);
--> statement-breakpoint
CREATE INDEX `orders_state_index` ON `orders` (`state`);
--> statement-breakpoint
CREATE UNIQUE INDEX `portfolios_membership_id_unique` ON `portfolios` (`membership_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `portfolios_demonstration_class_id_unique` ON `portfolios` (`demonstration_class_id`);
