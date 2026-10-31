CREATE TABLE `github_actividad` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`commits` integer DEFAULT 0 NOT NULL,
	`pull_requests` integer DEFAULT 0 NOT NULL,
	`issues` integer DEFAULT 0 NOT NULL,
	`actualizado_en` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_actividad_fecha_unique` ON `github_actividad` (`fecha`);--> statement-breakpoint
CREATE TABLE `habito_registros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`habito_id` integer NOT NULL,
	`fecha` text NOT NULL,
	`completado` integer DEFAULT false NOT NULL,
	`notas` text,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`habito_id`) REFERENCES `habitos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `habitos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`descripcion` text,
	`tipo` text DEFAULT 'bueno' NOT NULL,
	`color` text DEFAULT '#163300' NOT NULL,
	`emoji` text,
	`frecuencia` text DEFAULT 'diaria' NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	`actualizado_en` text
);
