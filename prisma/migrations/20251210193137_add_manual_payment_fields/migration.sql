-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionId" TEXT,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "razorpay_order_id" TEXT,
    "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
    "recordedBy" TEXT,
    "manualEntryNotes" TEXT,
    "receiptNumber" TEXT,
    "studentId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "eventId", "id", "paymentDate", "paymentMethod", "razorpay_order_id", "screenshotUrl", "status", "studentId", "transactionId", "updatedAt") SELECT "amount", "createdAt", "eventId", "id", "paymentDate", "paymentMethod", "razorpay_order_id", "screenshotUrl", "status", "studentId", "transactionId", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
