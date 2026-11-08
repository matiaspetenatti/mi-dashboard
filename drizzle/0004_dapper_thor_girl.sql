CREATE TABLE `grupos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`color` text DEFAULT '#737373' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `tags` ADD `color` text DEFAULT '#737373' NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `icono` text;--> statement-breakpoint
ALTER TABLE `tareas` ADD `en_curso` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tareas` ADD `grupo_id` integer REFERENCES grupos(id);--> statement-breakpoint
ALTER TABLE `tareas` ADD `recurrencia_cada` integer DEFAULT 1 NOT NULL;

--> statement-breakpoint
UPDATE `tareas` SET `recurrencia` = CASE `recurrencia`
  WHEN 'diaria' THEN 'dia'
  WHEN 'semanal' THEN 'semana'
  WHEN 'mensual' THEN 'mes'
  ELSE `recurrencia` END
WHERE `recurrencia` IS NOT NULL;