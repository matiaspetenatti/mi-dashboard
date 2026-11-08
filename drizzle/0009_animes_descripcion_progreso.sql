ALTER TABLE `animes_vistos` ADD `descripcion` text;
--> statement-breakpoint
ALTER TABLE `animes_vistos` ADD `episodios_vistos` integer DEFAULT 0 NOT NULL;
