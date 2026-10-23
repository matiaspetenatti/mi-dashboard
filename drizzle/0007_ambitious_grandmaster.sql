CREATE TABLE `animes_vistos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mal_id` integer NOT NULL,
	`titulo` text NOT NULL,
	`titulo_ingles` text,
	`imagen` text NOT NULL,
	`tipo` text,
	`episodios` integer,
	`ano` integer,
	`fecha_emision` text,
	`generos` text DEFAULT '[]',
	`score_mal` real,
	`mi_puntaje` integer,
	`estado` text DEFAULT 'completado' NOT NULL,
	`rewatch` integer DEFAULT false NOT NULL,
	`notas` text,
	`agregado_en` text DEFAULT (datetime('now')) NOT NULL,
	`actualizado_en` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `animes_vistos_mal_id_unique` ON `animes_vistos` (`mal_id`);