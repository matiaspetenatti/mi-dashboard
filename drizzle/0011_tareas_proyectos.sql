CREATE TABLE `estados_proyecto` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proyecto_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`color` text DEFAULT '#737373' NOT NULL,
	`categoria` text DEFAULT 'pendiente' NOT NULL,
	`posicion` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `estados_proyecto_proyecto_idx` ON `estados_proyecto` (`proyecto_id`);--> statement-breakpoint
CREATE TABLE `etiquetas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`color` text DEFAULT '#737373' NOT NULL,
	`icono` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `etiquetas_nombre_unique` ON `etiquetas` (`nombre`);--> statement-breakpoint
CREATE TABLE `proyectos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`slug` text NOT NULL,
	`descripcion` text,
	`icono` text DEFAULT 'carpeta' NOT NULL,
	`color` text DEFAULT '#6750a4' NOT NULL,
	`prefijo` text DEFAULT 'TAR' NOT NULL,
	`posicion` integer DEFAULT 0 NOT NULL,
	`archivado` integer DEFAULT false NOT NULL,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	`actualizado_en` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proyectos_slug_unique` ON `proyectos` (`slug`);--> statement-breakpoint
CREATE TABLE `tareas_etiquetas` (
	`tarea_id` integer NOT NULL,
	`etiqueta_id` integer NOT NULL,
	PRIMARY KEY(`tarea_id`, `etiqueta_id`),
	FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`etiqueta_id`) REFERENCES `etiquetas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vistas_proyecto` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proyecto_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`tipo` text NOT NULL,
	`config` text NOT NULL,
	`posicion` integer DEFAULT 0 NOT NULL,
	`predeterminada` integer DEFAULT false NOT NULL,
	`creada_en` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vistas_proyecto_proyecto_idx` ON `vistas_proyecto` (`proyecto_id`);--> statement-breakpoint
DROP TABLE `grupos`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
DROP TABLE `tareas_tags`;--> statement-breakpoint
ALTER TABLE `tareas` ADD `proyecto_id` integer NOT NULL REFERENCES proyectos(id);--> statement-breakpoint
ALTER TABLE `tareas` ADD `estado_id` integer NOT NULL REFERENCES estados_proyecto(id);--> statement-breakpoint
ALTER TABLE `tareas` ADD `descripcion` text;--> statement-breakpoint
ALTER TABLE `tareas` ADD `prioridad` text;--> statement-breakpoint
ALTER TABLE `tareas` ADD `fecha_inicio` text;--> statement-breakpoint
ALTER TABLE `tareas` ADD `completada_en` text;--> statement-breakpoint
ALTER TABLE `tareas` ADD `posicion` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tareas` ADD `actualizada_en` text;--> statement-breakpoint
CREATE INDEX `tareas_proyecto_idx` ON `tareas` (`proyecto_id`);--> statement-breakpoint
CREATE INDEX `tareas_estado_idx` ON `tareas` (`estado_id`);--> statement-breakpoint
CREATE INDEX `tareas_parent_idx` ON `tareas` (`parent_id`);--> statement-breakpoint
CREATE INDEX `tareas_fecha_idx` ON `tareas` (`fecha_limite`);--> statement-breakpoint
ALTER TABLE `tareas` DROP COLUMN `completada`;--> statement-breakpoint
ALTER TABLE `tareas` DROP COLUMN `en_curso`;--> statement-breakpoint
ALTER TABLE `tareas` DROP COLUMN `grupo_id`;