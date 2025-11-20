-- AlterTable
ALTER TABLE "User" ADD COLUMN "telefone" TEXT;

-- CreateTable
CREATE TABLE "CodigoVerificacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telefone" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "expiraEm" DATETIME NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CodigoVerificacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CodigoVerificacao_telefone_codigo_idx" ON "CodigoVerificacao"("telefone", "codigo");
