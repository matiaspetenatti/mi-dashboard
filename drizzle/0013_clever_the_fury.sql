DROP TABLE IF EXISTS `examenes`;--> statement-breakpoint
DROP TABLE IF EXISTS `materias`;--> statement-breakpoint
CREATE TABLE `carreras` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`institucion` text,
	`estado` text DEFAULT 'cursando' NOT NULL,
	`anio_inicio` integer,
	`anio_fin` integer,
	`materias_totales` integer,
	`color` text DEFAULT '#8b4a2b' NOT NULL,
	`notas` text,
	`creada_en` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `materias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`carrera_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`anio` integer,
	`cuatrimestre` text,
	`creditos` integer,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`nota_final` real,
	`profesor` text,
	`notas` text,
	`creada_en` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`carrera_id`) REFERENCES `carreras`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `materias_carrera_nombre_unico` ON `materias` (`carrera_id`,`nombre`);--> statement-breakpoint
CREATE INDEX `materias_carrera_idx` ON `materias` (`carrera_id`);--> statement-breakpoint
CREATE TABLE `examenes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`materia_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`titulo` text,
	`fecha` text NOT NULL,
	`nota` real,
	`estado` text DEFAULT 'programado' NOT NULL,
	`observaciones` text,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`materia_id`) REFERENCES `materias`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `examenes_materia_idx` ON `examenes` (`materia_id`);--> statement-breakpoint
CREATE INDEX `examenes_fecha_idx` ON `examenes` (`fecha`);