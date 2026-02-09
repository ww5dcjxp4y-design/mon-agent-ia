CREATE TABLE `codeFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`language` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codeFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codeProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`language` varchar(64) NOT NULL DEFAULT 'javascript',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codeProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `codeFiles` ADD CONSTRAINT `codeFiles_projectId_codeProjects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `codeProjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codeProjects` ADD CONSTRAINT `codeProjects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;