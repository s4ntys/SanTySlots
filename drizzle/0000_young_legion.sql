CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wins` (
	`id` text PRIMARY KEY NOT NULL,
	`player` text NOT NULL,
	`name` text NOT NULL,
	`game` text NOT NULL,
	`amount` integer NOT NULL,
	`bet` integer NOT NULL,
	`created` integer NOT NULL
);
