CREATE TABLE `tarea_adjuntos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tarea_id` integer NOT NULL,
	`tipo` text DEFAULT 'enlace' NOT NULL,
	`nombre` text NOT NULL,
	`url` text NOT NULL,
	`tamano` integer,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tarea_adjuntos_tarea_idx` ON `tarea_adjuntos` (`tarea_id`);--> statement-breakpoint
CREATE TABLE `tarea_comentarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tarea_id` integer NOT NULL,
	`autor_id` text NOT NULL,
	`texto` text NOT NULL,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	`editado_en` text,
	FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tarea_comentarios_tarea_idx` ON `tarea_comentarios` (`tarea_id`);--> statement-breakpoint
CREATE TABLE `tarea_dependencias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tarea_id` integer NOT NULL,
	`depende_de_id` integer NOT NULL,
	`tipo` text DEFAULT 'bloquea' NOT NULL,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`depende_de_id`) REFERENCES `tareas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tarea_dependencias_tarea_idx` ON `tarea_dependencias` (`tarea_id`);--> statement-breakpoint
CREATE INDEX `tarea_dependencias_depe_idx` ON `tarea_dependencias` (`depende_de_id`);--> statement-breakpoint
CREATE TABLE `vistas_guardadas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` text NOT NULL,
	`nombre` text NOT NULL,
	`alcance` text DEFAULT 'global' NOT NULL,
	`proyecto_id` integer,
	`config` text NOT NULL,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	`actualizado_en` text,
	FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vistas_guardadas_usuario_idx` ON `vistas_guardadas` (`usuario_id`);--> statement-breakpoint
DROP INDEX `etiquetas_nombre_unique`;--> statement-breakpoint
ALTER TABLE `etiquetas` ADD `proyecto_id` integer REFERENCES proyectos(id);--> statement-breakpoint
CREATE INDEX `etiquetas_proyecto_idx` ON `etiquetas` (`proyecto_id`);--> statement-breakpoint
ALTER TABLE `tareas` ADD `destacada` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tareas` ADD `archivada_en` text;--> statement-breakpoint
ALTER TABLE `tareas` ADD `estimacion_minutos` integer;--> statement-breakpoint
ALTER TABLE `tareas` ADD `tiempo_registrado_segundos` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tareas` ADD `color` text;--> statement-breakpoint
ALTER TABLE `tareas` ADD `recurrencia_dias_semana` text;--> statement-breakpoint
ALTER TABLE `tareas` ADD `recurrencia_fin` text;--> statement-breakpoint
ALTER TABLE `tareas` ADD `recurrencia_saltada` text;--> statement-breakpoint
ALTER TABLE `tareas` ADD `asignado_a` text;