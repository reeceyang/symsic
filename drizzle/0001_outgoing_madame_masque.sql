ALTER TABLE "symsic_kern_score" ALTER COLUMN "kern_data" SET DATA TYPE varchar(2000000);--> statement-breakpoint
ALTER TABLE "symsic_kern_score" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "symsic_kern_score" DROP COLUMN IF EXISTS "updated_at";