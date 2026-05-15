-- Allow transactional emails not tied to a User (e.g. customer confirmation).
ALTER TABLE "EmailLog" ALTER COLUMN "userId" DROP NOT NULL;
