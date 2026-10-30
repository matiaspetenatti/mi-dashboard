CREATE TABLE `salud_episodio_desencadenantes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`episodio_id` integer NOT NULL,
	`factor` text NOT NULL,
	FOREIGN KEY (`episodio_id`) REFERENCES `salud_episodios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `salud_episodio_factor_unico` ON `salud_episodio_desencadenantes` (`episodio_id`,`factor`);--> statement-breakpoint
CREATE INDEX `salud_episodio_factor_episodio_idx` ON `salud_episodio_desencadenantes` (`episodio_id`);--> statement-breakpoint
CREATE TABLE `salud_episodios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inicio_en` text NOT NULL,
	`fin_en` text,
	`intensidad` integer NOT NULL,
	`patron` text,
	`lateralidad` text,
	`aura` integer DEFAULT false NOT NULL,
	`aura_tipos` text DEFAULT '[]' NOT NULL,
	`sintomas` text DEFAULT '[]' NOT NULL,
	`tomo_tetralgin` integer DEFAULT false NOT NULL,
	`dosis_tetralgin` integer,
	`tetralgin_en` text,
	`alivio` text,
	`otro_desencadenante` text,
	`notas` text,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	`actualizado_en` text
);
--> statement-breakpoint
CREATE INDEX `salud_episodios_inicio_idx` ON `salud_episodios` (`inicio_en`);--> statement-breakpoint
CREATE TABLE `salud_registros_diarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`horas_sueno` real,
	`calidad_sueno` integer,
	`vasos_agua` integer,
	`nivel_estres` integer,
	`horas_pantalla` real,
	`tazas_cafeina` integer,
	`comidas_omitidas` integer,
	`actividad_min` integer,
	`animo` integer,
	`peso_kg` real,
	`notas` text,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	`actualizado_en` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `salud_registros_fecha_unica` ON `salud_registros_diarios` (`fecha`);