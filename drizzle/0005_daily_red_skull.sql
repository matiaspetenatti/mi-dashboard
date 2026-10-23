CREATE TABLE `cuentas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`tipo` text DEFAULT 'billetera' NOT NULL,
	`color` text DEFAULT '#3b82f6' NOT NULL,
	`rendimiento_anual` real DEFAULT 0 NOT NULL,
	`ultimo_rendimiento_fecha` text,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `movimientos` ADD `cuenta_id` integer REFERENCES cuentas(id);