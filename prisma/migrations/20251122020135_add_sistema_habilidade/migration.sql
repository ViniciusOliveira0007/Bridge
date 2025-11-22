-- CreateTable
CREATE TABLE "ProjetoHabilidade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projetoId" INTEGER NOT NULL,
    "habilidadeId" INTEGER NOT NULL,
    "nivelMinimo" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ProjetoHabilidade_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "ProjetoEmpresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjetoHabilidade_habilidadeId_fkey" FOREIGN KEY ("habilidadeId") REFERENCES "Habilidade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjetoEmpresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Aberto',
    "categoria" TEXT,
    "prioridade" TEXT NOT NULL DEFAULT 'Media',
    "prazo" DATETIME,
    "vagasTotal" INTEGER NOT NULL DEFAULT 1,
    "vagasPreenchidas" INTEGER NOT NULL DEFAULT 0,
    "imagemUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjetoEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProjetoEmpresa" ("createdAt", "descricao", "empresaId", "estado", "id", "imagemUrl", "nome", "updatedAt") SELECT "createdAt", "descricao", "empresaId", "estado", "id", "imagemUrl", "nome", "updatedAt" FROM "ProjetoEmpresa";
DROP TABLE "ProjetoEmpresa";
ALTER TABLE "new_ProjetoEmpresa" RENAME TO "ProjetoEmpresa";
CREATE INDEX "ProjetoEmpresa_empresaId_estado_idx" ON "ProjetoEmpresa"("empresaId", "estado");
CREATE INDEX "ProjetoEmpresa_categoria_idx" ON "ProjetoEmpresa"("categoria");
CREATE INDEX "ProjetoEmpresa_estado_prioridade_idx" ON "ProjetoEmpresa"("estado", "prioridade");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProjetoHabilidade_projetoId_habilidadeId_key" ON "ProjetoHabilidade"("projetoId", "habilidadeId");
