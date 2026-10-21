CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_nombre_unique` ON `tags` (`nombre`);--> statement-breakpoint
CREATE TABLE `tareas_tags` (
	`tarea_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`tarea_id`, `tag_id`),
	FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `tareas` ADD `parent_id` integer REFERENCES tareas(id);--> statement-breakpoint
ALTER TABLE `tareas` ADD `recurrencia` text;