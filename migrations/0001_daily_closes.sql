CREATE TABLE `index_daily_closes` (
	`code` text NOT NULL,
	`date` text NOT NULL,
	`close` real NOT NULL,
	PRIMARY KEY(`code`, `date`)
);
--> statement-breakpoint
CREATE TABLE `stock_daily_closes` (
	`code` text NOT NULL,
	`date` text NOT NULL,
	`close` real NOT NULL,
	PRIMARY KEY(`code`, `date`)
);
--> statement-breakpoint
ALTER TABLE `price_updates` ADD `final_date` text;