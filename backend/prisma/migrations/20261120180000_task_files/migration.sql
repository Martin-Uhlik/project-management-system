-- Who uploaded each task file and when
CREATE TYPE "TaskFileKind" AS ENUM ('INPUT', 'OUTPUT');

CREATE TABLE "TaskFile" (
    "ID" SERIAL NOT NULL,
    "TaskID" INTEGER NOT NULL,
    "Kind" "TaskFileKind" NOT NULL,
    "Name" TEXT NOT NULL,
    "UploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UploadedByID" INTEGER,

    CONSTRAINT "TaskFile_pkey" PRIMARY KEY ("ID")
);

CREATE UNIQUE INDEX "TaskFile_TaskID_Kind_Name_key" ON "TaskFile"("TaskID", "Kind", "Name");

ALTER TABLE "TaskFile" ADD CONSTRAINT "TaskFile_TaskID_fkey" FOREIGN KEY ("TaskID") REFERENCES "Task"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TaskFile" ADD CONSTRAINT "TaskFile_UploadedByID_fkey" FOREIGN KEY ("UploadedByID") REFERENCES "User"("ID") ON DELETE SET NULL ON UPDATE CASCADE;
