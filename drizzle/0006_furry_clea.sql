CREATE TABLE `categorias_finanzas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`tipo` text NOT NULL,
	`icono` text DEFAULT 'Tag' NOT NULL,
	`parent_id` integer,
	`orden` integer DEFAULT 0 NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`es_sistema` integer DEFAULT false NOT NULL,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categorias_finanzas`(`id`) ON UPDATE no action ON DELETE no action
);
