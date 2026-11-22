-- A machine's responsible person, its services (done and planned) and who uploaded its files
ALTER TABLE "Machine" ADD COLUMN "ResponsibleID" INTEGER;

CREATE TABLE "MachineService" (
    "ID" SERIAL NOT NULL,
    "MachineID" INTEGER NOT NULL,
    "Date" TIMESTAMP(3) NOT NULL,
    "Done" BOOLEAN NOT NULL DEFAULT false,
    "Title" TEXT NOT NULL,
    "Note" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedByID" INTEGER,

    CONSTRAINT "MachineService_pkey" PRIMARY KEY ("ID")
);

CREATE TABLE "MachineFile" (
    "ID" SERIAL NOT NULL,
    "MachineID" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "UploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UploadedByID" INTEGER,

    CONSTRAINT "MachineFile_pkey" PRIMARY KEY ("ID")
);

CREATE UNIQUE INDEX "MachineFile_MachineID_Name_key" ON "MachineFile"("MachineID", "Name");

ALTER TABLE "Machine" ADD CONSTRAINT "Machine_ResponsibleID_fkey" FOREIGN KEY ("ResponsibleID") REFERENCES "User"("ID") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MachineService" ADD CONSTRAINT "MachineService_MachineID_fkey" FOREIGN KEY ("MachineID") REFERENCES "Machine"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MachineService" ADD CONSTRAINT "MachineService_CreatedByID_fkey" FOREIGN KEY ("CreatedByID") REFERENCES "User"("ID") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MachineFile" ADD CONSTRAINT "MachineFile_MachineID_fkey" FOREIGN KEY ("MachineID") REFERENCES "Machine"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MachineFile" ADD CONSTRAINT "MachineFile_UploadedByID_fkey" FOREIGN KEY ("UploadedByID") REFERENCES "User"("ID") ON DELETE SET NULL ON UPDATE CASCADE;
