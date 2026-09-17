-- Вход по логину вместо email
ALTER TABLE "User" RENAME COLUMN "email" TO "login";
ALTER INDEX "User_email_key" RENAME TO "User_login_key";

-- Администратор из старого сида по умолчанию получает логин admin
UPDATE "User" SET "login" = 'admin'
WHERE "login" = 'admin@electronica.local'
  AND NOT EXISTS (SELECT 1 FROM "User" WHERE "login" = 'admin');
