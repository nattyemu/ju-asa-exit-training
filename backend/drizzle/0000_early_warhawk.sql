CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(100) DEFAULT '🏆',
	`type` varchar(50) NOT NULL,
	`requirement` text,
	`points` int DEFAULT 10,
	`is_active` boolean DEFAULT true,
	`created_at` datetime DEFAULT '2026-02-24 06:39:18.725',
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_exam_id` int NOT NULL,
	`question_id` int NOT NULL,
	`chosen_answer` varchar(1) NOT NULL,
	`is_correct` boolean,
	CONSTRAINT `answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`available_from` datetime NOT NULL,
	`available_until` datetime NOT NULL,
	`duration` int NOT NULL,
	`is_active` boolean DEFAULT false,
	`total_questions` int NOT NULL,
	`passing_score` float DEFAULT 50,
	`created_at` datetime DEFAULT '2026-02-24 06:39:18.724',
	`updated_at` datetime DEFAULT '2026-02-24 06:39:18.724',
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`department` varchar(255) NOT NULL,
	`university` varchar(255) NOT NULL,
	`year` int NOT NULL,
	`profile_image_url` varchar(500),
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exam_id` int NOT NULL,
	`question_text` text NOT NULL,
	`option_a` varchar(500) NOT NULL,
	`option_b` varchar(500) NOT NULL,
	`option_c` varchar(500) NOT NULL,
	`option_d` varchar(500) NOT NULL,
	`correct_answer` varchar(1) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`difficulty` varchar(50) DEFAULT 'MEDIUM',
	`explanation` text,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_exam_id` int NOT NULL,
	`score` float NOT NULL,
	`correct_answers` int NOT NULL,
	`total_questions` int NOT NULL,
	`rank` int,
	`time_spent` int NOT NULL,
	`submitted_at` datetime DEFAULT '2026-02-24 06:39:18.725',
	CONSTRAINT `results_id` PRIMARY KEY(`id`),
	CONSTRAINT `results_student_exam_id_unique` UNIQUE(`student_exam_id`)
);
--> statement-breakpoint
CREATE TABLE `student_exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`exam_id` int NOT NULL,
	`started_at` datetime NOT NULL,
	`submitted_at` datetime,
	`time_spent` int,
	`updated_at` datetime DEFAULT '2026-02-24 06:39:18.725',
	CONSTRAINT `student_exams_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_exam_idx` UNIQUE(`student_id`,`exam_id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`achievement_id` int NOT NULL,
	`earned_at` datetime DEFAULT '2026-02-24 06:39:18.725',
	`progress` int DEFAULT 0,
	`metadata` text,
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_achievement_idx` UNIQUE(`user_id`,`achievement_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'STUDENT',
	`created_at` datetime DEFAULT '2026-02-24 06:39:18.722',
	`is_active` boolean NOT NULL DEFAULT true,
	`reset_password_otp` varchar(6),
	`reset_password_expires` datetime,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `student_exam_answer_idx` ON `answers` (`student_exam_id`);--> statement-breakpoint
CREATE INDEX `question_answer_idx` ON `answers` (`question_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `exam_idx` ON `questions` (`exam_id`);--> statement-breakpoint
CREATE INDEX `result_student_exam_idx` ON `results` (`student_exam_id`);--> statement-breakpoint
CREATE INDEX `student_idx` ON `student_exams` (`student_id`);--> statement-breakpoint
CREATE INDEX `exam_student_idx` ON `student_exams` (`exam_id`);--> statement-breakpoint
CREATE INDEX `active_session_idx` ON `student_exams` (`student_id`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `user_achievement_user_idx` ON `user_achievements` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_achievement_achievement_idx` ON `user_achievements` (`achievement_id`);