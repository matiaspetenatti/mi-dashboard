DROP INDEX `comida_menu_dia_momento_unico`;--> statement-breakpoint
ALTER TABLE `comida_menu` ADD `nutricion` text;--> statement-breakpoint
CREATE INDEX `comida_menu_dia_momento_idx` ON `comida_menu` (`dia`,`momento`);