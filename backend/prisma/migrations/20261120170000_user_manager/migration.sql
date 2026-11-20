-- Every worker can have a manager (another user)
ALTER TABLE "User" ADD COLUMN "ManagerID" INTEGER;

ALTER TABLE "User" ADD CONSTRAINT "User_ManagerID_fkey" FOREIGN KEY ("ManagerID") REFERENCES "User"("ID") ON DELETE SET NULL ON UPDATE CASCADE;
