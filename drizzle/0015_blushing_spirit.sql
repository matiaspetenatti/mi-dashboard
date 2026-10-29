CREATE TABLE `sesiones_estudio` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`carrera_id` integer NOT NULL,
	`materia_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`duracion_minutos` integer NOT NULL,
	`fecha` text NOT NULL,
	`creada_en` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`carrera_id`) REFERENCES `carreras`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`materia_id`) REFERENCES `materias`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sesiones_estudio_carrera_idx` ON `sesiones_estudio` (`carrera_id`);--> statement-breakpoint
CREATE INDEX `sesiones_estudio_materia_idx` ON `sesiones_estudio` (`materia_id`);--> statement-breakpoint
CREATE INDEX `sesiones_estudio_fecha_idx` ON `sesiones_estudio` (`fecha`);