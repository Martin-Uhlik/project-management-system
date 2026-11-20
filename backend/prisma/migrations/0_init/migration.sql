-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'MANAGER', 'USER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ADD', 'REMOVE', 'RESERVATION');

-- CreateTable
CREATE TABLE "UserSession" (
    "ID" SERIAL NOT NULL,
    "Token" TEXT NOT NULL,
    "Expires" TIMESTAMP(3) NOT NULL,
    "UserID" INTEGER NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "User" (
    "ID" SERIAL NOT NULL,
    "UserName" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "PasswordSalt" TEXT NOT NULL,
    "Enabled" BOOLEAN NOT NULL,
    "Position" TEXT NOT NULL,
    "WorkStartTime" TIMESTAMP(3),
    "UserType" "UserType" NOT NULL,
    "Deleted" BOOLEAN NOT NULL DEFAULT false,
    "CurrentTaskID" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "PrivateTask" (
    "ID" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "FinifhDate" TIMESTAMP(3) NOT NULL,
    "Finished" BOOLEAN NOT NULL,
    "UserID" INTEGER NOT NULL,

    CONSTRAINT "PrivateTask_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "WorkTime" (
    "ID" SERIAL NOT NULL,
    "StartTime" TIMESTAMP(3) NOT NULL,
    "StopTime" TIMESTAMP(3),
    "UserID" INTEGER NOT NULL,

    CONSTRAINT "WorkTime_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "UserTaskTime" (
    "ID" SERIAL NOT NULL,
    "StartTime" TIMESTAMP(3) NOT NULL,
    "StopTime" TIMESTAMP(3),
    "UserID" INTEGER NOT NULL,
    "TaskID" INTEGER NOT NULL,

    CONSTRAINT "UserTaskTime_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "User_Task" (
    "ID" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "TaskID" INTEGER NOT NULL,

    CONSTRAINT "User_Task_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "Task" (
    "ID" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "FinishDate" TIMESTAMP(3) NOT NULL,
    "Finished" BOOLEAN NOT NULL,
    "DurationHours" INTEGER NOT NULL DEFAULT 0,
    "DurationMinutes" INTEGER NOT NULL DEFAULT 0,
    "XPosition" DOUBLE PRECISION NOT NULL,
    "YPosition" DOUBLE PRECISION NOT NULL,
    "Size" INTEGER NOT NULL,
    "OwnerID" INTEGER NOT NULL,
    "ProjectID" INTEGER NOT NULL,
    "MachineID" INTEGER,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "ID" SERIAL NOT NULL,
    "ProjectID" INTEGER NOT NULL,
    "PredecessorID" INTEGER NOT NULL,
    "SuccessorID" INTEGER NOT NULL,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "Machine" (
    "ID" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "Deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "MaterialRequest" (
    "ID" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "Count" INTEGER NOT NULL,
    "Price" INTEGER NOT NULL,
    "AddedDate" TIMESTAMP(3) NOT NULL,
    "NeededDate" TIMESTAMP(3),
    "AcceptedDate" TIMESTAMP(3),
    "AcceptedByID" INTEGER,
    "TargetTaskID" INTEGER,
    "TargetUserID" INTEGER NOT NULL,

    CONSTRAINT "MaterialRequest_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "MaterialEvent" (
    "ID" SERIAL NOT NULL,
    "Count" INTEGER NOT NULL,
    "TargetTaskID" INTEGER,
    "TargetUserID" INTEGER,
    "MaterialID" INTEGER NOT NULL,
    "EventType" "EventType" NOT NULL,

    CONSTRAINT "MaterialEvent_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "Material" (
    "ID" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "Project" (
    "ID" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "Customer" TEXT,
    "FinishDate" TIMESTAMP(3),
    "Finished" BOOLEAN NOT NULL,
    "Deleted" BOOLEAN NOT NULL DEFAULT false,
    "OwnerID" INTEGER NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "User_Project" (
    "ID" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "ProjectID" INTEGER NOT NULL,

    CONSTRAINT "User_Project_pkey" PRIMARY KEY ("ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_Token_key" ON "UserSession"("Token");

-- CreateIndex
CREATE UNIQUE INDEX "User_UserName_key" ON "User"("UserName");

-- CreateIndex
CREATE UNIQUE INDEX "User_PasswordHash_key" ON "User"("PasswordHash");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_CurrentTaskID_fkey" FOREIGN KEY ("CurrentTaskID") REFERENCES "Task"("ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateTask" ADD CONSTRAINT "PrivateTask_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTime" ADD CONSTRAINT "WorkTime_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTaskTime" ADD CONSTRAINT "UserTaskTime_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTaskTime" ADD CONSTRAINT "UserTaskTime_TaskID_fkey" FOREIGN KEY ("TaskID") REFERENCES "Task"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Task" ADD CONSTRAINT "User_Task_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Task" ADD CONSTRAINT "User_Task_TaskID_fkey" FOREIGN KEY ("TaskID") REFERENCES "Task"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_OwnerID_fkey" FOREIGN KEY ("OwnerID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ProjectID_fkey" FOREIGN KEY ("ProjectID") REFERENCES "Project"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_MachineID_fkey" FOREIGN KEY ("MachineID") REFERENCES "Machine"("ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_ProjectID_fkey" FOREIGN KEY ("ProjectID") REFERENCES "Project"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_PredecessorID_fkey" FOREIGN KEY ("PredecessorID") REFERENCES "Task"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_SuccessorID_fkey" FOREIGN KEY ("SuccessorID") REFERENCES "Task"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_AcceptedByID_fkey" FOREIGN KEY ("AcceptedByID") REFERENCES "User"("ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_TargetTaskID_fkey" FOREIGN KEY ("TargetTaskID") REFERENCES "Task"("ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_TargetUserID_fkey" FOREIGN KEY ("TargetUserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialEvent" ADD CONSTRAINT "MaterialEvent_TargetTaskID_fkey" FOREIGN KEY ("TargetTaskID") REFERENCES "Task"("ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialEvent" ADD CONSTRAINT "MaterialEvent_TargetUserID_fkey" FOREIGN KEY ("TargetUserID") REFERENCES "User"("ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialEvent" ADD CONSTRAINT "MaterialEvent_MaterialID_fkey" FOREIGN KEY ("MaterialID") REFERENCES "Material"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_OwnerID_fkey" FOREIGN KEY ("OwnerID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Project" ADD CONSTRAINT "User_Project_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Project" ADD CONSTRAINT "User_Project_ProjectID_fkey" FOREIGN KEY ("ProjectID") REFERENCES "Project"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

