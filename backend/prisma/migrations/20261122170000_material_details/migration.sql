-- Stock items get a unit, price, supplier, location and a minimum; stock movements a time; requests the item they restock
ALTER TABLE "Material" ADD COLUMN "Unit" TEXT NOT NULL DEFAULT 'ks',
ADD COLUMN "Price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "Supplier" TEXT,
ADD COLUMN "Location" TEXT,
ADD COLUMN "MinCount" INTEGER NOT NULL DEFAULT 0;

-- a reservation given back
ALTER TYPE "EventType" ADD VALUE 'RELEASE';

ALTER TABLE "MaterialEvent" ADD COLUMN "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "MaterialRequest" ADD COLUMN "MaterialID" INTEGER;

ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_MaterialID_fkey" FOREIGN KEY ("MaterialID") REFERENCES "Material"("ID") ON DELETE SET NULL ON UPDATE CASCADE;
