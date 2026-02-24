ALTER TABLE `achievements` MODIFY COLUMN `created_at` datetime DEFAULT '2026-02-24 06:58:16.718';--> statement-breakpoint
ALTER TABLE `exams` MODIFY COLUMN `created_at` datetime DEFAULT '2026-02-24 06:58:16.717';--> statement-breakpoint
ALTER TABLE `exams` MODIFY COLUMN `updated_at` datetime DEFAULT '2026-02-24 06:58:16.717';--> statement-breakpoint
ALTER TABLE `results` MODIFY COLUMN `submitted_at` datetime DEFAULT '2026-02-24 06:58:16.718';--> statement-breakpoint
ALTER TABLE `student_exams` MODIFY COLUMN `updated_at` datetime DEFAULT '2026-02-24 06:58:16.718';--> statement-breakpoint
ALTER TABLE `user_achievements` MODIFY COLUMN `earned_at` datetime DEFAULT '2026-02-24 06:58:16.718';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` datetime DEFAULT '2026-02-24 06:58:16.716';