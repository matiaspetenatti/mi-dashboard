ALTER TABLE `animes_vistos` ADD `favorito` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `animes_vistos` ADD `anilist_id` integer;--> statement-breakpoint
ALTER TABLE `animes_vistos` ADD `estudio` text;--> statement-breakpoint
ALTER TABLE `animes_vistos` ADD `fuente` text;--> statement-breakpoint
ALTER TABLE `animes_vistos` ADD `formato` text;--> statement-breakpoint
ALTER TABLE `animes_vistos` ADD `tags` text DEFAULT '[]';--> statement-breakpoint
CREATE INDEX `animes_vistos_kitsu_id_idx` ON `animes_vistos` (`kitsu_id`);--> statement-breakpoint
CREATE INDEX `animes_vistos_anilist_id_idx` ON `animes_vistos` (`anilist_id`);--> statement-breakpoint
CREATE INDEX `animes_vistos_estado_idx` ON `animes_vistos` (`estado`);--> statement-breakpoint
CREATE INDEX `animes_vistos_favorito_idx` ON `animes_vistos` (`favorito`);--> statement-breakpoint
CREATE INDEX `animes_vistos_ano_idx` ON `animes_vistos` (`ano`);--> statement-breakpoint
CREATE INDEX `animes_vistos_estudio_idx` ON `animes_vistos` (`estudio`);--> statement-breakpoint
CREATE INDEX `animes_vistos_fecha_emision_idx` ON `animes_vistos` (`fecha_emision`);