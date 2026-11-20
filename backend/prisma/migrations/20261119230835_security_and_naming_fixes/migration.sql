-- Fix the misspelled PrivateTask column (rename, so existing personal tasks keep their dates)
ALTER TABLE "PrivateTask" RENAME COLUMN "FinifhDate" TO "FinishDate";

-- Password hashes are no longer unique (two equal hashes said nothing useful, and the index only leaked that)
DROP INDEX "User_PasswordHash_key";

-- Accounts upgraded to scrypt keep the salt inside PasswordHash, so PasswordSalt is only set on old SHA-256 accounts
ALTER TABLE "User" ALTER COLUMN "PasswordSalt" DROP NOT NULL;

-- Sessions now store a SHA-256 of the token instead of the token; old sessions can't be matched, so sign everyone out
DELETE FROM "UserSession";

CREATE INDEX "UserSession_UserID_idx" ON "UserSession"("UserID");
