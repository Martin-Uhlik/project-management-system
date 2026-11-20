-- Chat: direct messages between two users and a group chat per project, with how far each user has read
-- CreateTable
CREATE TABLE "ChatMessage" (
    "ID" SERIAL NOT NULL,
    "SenderID" INTEGER NOT NULL,
    "RecipientID" INTEGER,
    "ProjectID" INTEGER,
    "Text" TEXT NOT NULL,
    "SentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "ChatRead" (
    "ID" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "PartnerID" INTEGER,
    "ProjectID" INTEGER,
    "LastReadID" INTEGER NOT NULL,

    CONSTRAINT "ChatRead_pkey" PRIMARY KEY ("ID")
);

-- CreateIndex
CREATE INDEX "ChatMessage_SenderID_RecipientID_ID_idx" ON "ChatMessage"("SenderID", "RecipientID", "ID");

-- CreateIndex
CREATE INDEX "ChatMessage_RecipientID_SenderID_ID_idx" ON "ChatMessage"("RecipientID", "SenderID", "ID");

-- CreateIndex
CREATE INDEX "ChatMessage_ProjectID_ID_idx" ON "ChatMessage"("ProjectID", "ID");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRead_UserID_PartnerID_key" ON "ChatRead"("UserID", "PartnerID");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRead_UserID_ProjectID_key" ON "ChatRead"("UserID", "ProjectID");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_SenderID_fkey" FOREIGN KEY ("SenderID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_RecipientID_fkey" FOREIGN KEY ("RecipientID") REFERENCES "User"("ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_ProjectID_fkey" FOREIGN KEY ("ProjectID") REFERENCES "Project"("ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRead" ADD CONSTRAINT "ChatRead_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRead" ADD CONSTRAINT "ChatRead_PartnerID_fkey" FOREIGN KEY ("PartnerID") REFERENCES "User"("ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRead" ADD CONSTRAINT "ChatRead_ProjectID_fkey" FOREIGN KEY ("ProjectID") REFERENCES "Project"("ID") ON DELETE CASCADE ON UPDATE CASCADE;


-- A message goes to exactly one user or one project; a read marker belongs to exactly one partner or one project
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_target_check" CHECK (("RecipientID" IS NULL) <> ("ProjectID" IS NULL));
ALTER TABLE "ChatRead" ADD CONSTRAINT "ChatRead_target_check" CHECK (("PartnerID" IS NULL) <> ("ProjectID" IS NULL));
