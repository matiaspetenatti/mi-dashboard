CREATE TABLE `clima_ubicacion` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`etiqueta` text,
	`latitud` real NOT NULL,
	`longitud` real NOT NULL,
	`actualizado_en` text DEFAULT (datetime('now')) NOT NULL
);
