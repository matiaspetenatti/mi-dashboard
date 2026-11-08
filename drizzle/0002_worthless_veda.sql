CREATE TABLE `examenes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`materia_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`fecha` text NOT NULL,
	`nota` real,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`materia_id`) REFERENCES `materias`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `materias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`creada_en` text DEFAULT (datetime('now')) NOT NULL
);
