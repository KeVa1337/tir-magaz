-- CreateEnum
CREATE TYPE "CallbackStatus" AS ENUM ('NEW', 'DONE');

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "offerId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "leadDays" INTEGER,
ADD COLUMN     "warehouse" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "lastServiceKm" INTEGER;

-- CreateTable
CREATE TABLE "SupplierOffer" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouse" TEXT NOT NULL,
    "city" TEXT,
    "qty" INTEGER NOT NULL,
    "leadDays" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SupplierOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallbackRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "comment" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'callback',
    "productId" TEXT,
    "orderId" TEXT,
    "status" "CallbackStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierOffer_productId_idx" ON "SupplierOffer"("productId");

-- CreateIndex
CREATE INDEX "CallbackRequest_status_idx" ON "CallbackRequest"("status");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "SupplierOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOffer" ADD CONSTRAINT "SupplierOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallbackRequest" ADD CONSTRAINT "CallbackRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
