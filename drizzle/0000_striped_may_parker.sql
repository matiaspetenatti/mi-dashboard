CREATE TABLE `tareas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`completada` integer DEFAULT false NOT NULL,
	`fecha_limite` text,
	`creada_en` text DEFAULT (datetime('now')) NOT NULL
);
