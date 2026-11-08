CREATE TABLE `comida_ingredientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`nombre_normalizado` text NOT NULL,
	`tipo` text DEFAULT 'ingrediente' NOT NULL,
	`categoria` text DEFAULT 'otros' NOT NULL,
	`cantidad` real DEFAULT 0 NOT NULL,
	`unidad` text DEFAULT 'unidad' NOT NULL,
	`ubicacion` text DEFAULT 'despensa' NOT NULL,
	`caduca_en` text,
	`stock_minimo` real,
	`notas` text,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	`actualizado_en` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comida_ingredientes_nombre_unico` ON `comida_ingredientes` (`nombre_normalizado`);--> statement-breakpoint
CREATE INDEX `comida_ingredientes_categoria_idx` ON `comida_ingredientes` (`categoria`);--> statement-breakpoint
CREATE TABLE `comida_lista` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`nombre_normalizado` text NOT NULL,
	`cantidad` real DEFAULT 1 NOT NULL,
	`unidad` text DEFAULT 'unidad' NOT NULL,
	`categoria` text DEFAULT 'otros' NOT NULL,
	`precio_centavos` integer,
	`comprado` integer DEFAULT false NOT NULL,
	`origen` text DEFAULT 'manual' NOT NULL,
	`receta_id` integer,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	`comprado_en` text,
	FOREIGN KEY (`receta_id`) REFERENCES `comida_recetas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `comida_lista_comprado_idx` ON `comida_lista` (`comprado`);--> statement-breakpoint
CREATE INDEX `comida_lista_categoria_idx` ON `comida_lista` (`categoria`);--> statement-breakpoint
CREATE TABLE `comida_menu` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dia` text NOT NULL,
	`momento` text NOT NULL,
	`receta_id` integer,
	`titulo` text,
	`ingredientes` text DEFAULT '[]' NOT NULL,
	`minutos` integer,
	`reutiliza` text,
	`hecho` integer DEFAULT false NOT NULL,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	`actualizado_en` text,
	FOREIGN KEY (`receta_id`) REFERENCES `comida_recetas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comida_menu_dia_momento_unico` ON `comida_menu` (`dia`,`momento`);--> statement-breakpoint
CREATE INDEX `comida_menu_dia_idx` ON `comida_menu` (`dia`);--> statement-breakpoint
CREATE TABLE `comida_recetas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`tipo` text DEFAULT 'cena' NOT NULL,
	`tono` text DEFAULT 'sencillo' NOT NULL,
	`minutos` integer DEFAULT 30 NOT NULL,
	`porciones` integer DEFAULT 2 NOT NULL,
	`ingredientes` text DEFAULT '[]' NOT NULL,
	`pasos` text DEFAULT '[]' NOT NULL,
	`tips` text,
	`nutricion` text,
	`herramientas` text DEFAULT '[]' NOT NULL,
	`vaso` text,
	`tecnica` text,
	`origen` text DEFAULT 'manual' NOT NULL,
	`favorita` integer DEFAULT false NOT NULL,
	`veces_cocinada` integer DEFAULT 0 NOT NULL,
	`ultima_vez_en` text,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL,
	`actualizado_en` text
);
--> statement-breakpoint
CREATE INDEX `comida_recetas_tipo_idx` ON `comida_recetas` (`tipo`);--> statement-breakpoint
CREATE INDEX `comida_recetas_favorita_idx` ON `comida_recetas` (`favorita`);