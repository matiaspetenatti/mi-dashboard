CREATE TABLE `movimientos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text NOT NULL,
	`monto` integer NOT NULL,
	`categoria` text NOT NULL,
	`descripcion` text,
	`fecha` text NOT NULL,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL
);
