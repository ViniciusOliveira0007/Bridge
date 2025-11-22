-- AlterTable
ALTER TABLE "User" ADD COLUMN "especializacaoEmAndamento" TEXT;
ALTER TABLE "User" ADD COLUMN "sobreMim" TEXT;

-- CreateTable
CREATE TABLE "Empresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "nomeEmpresa" TEXT NOT NULL,
    "logoUrl" TEXT,
    "descricao" TEXT,
    "site" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Empresa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjetoEmpresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Aberto',
    "imagemUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjetoEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Candidatura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projetoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aceito',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Candidatura_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "ProjetoEmpresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Candidatura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Formacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "instituicao" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" DATETIME,
    "dataFim" DATETIME,
    "emAndamento" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Formacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Habilidade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "icone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UsuarioHabilidade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "habilidadeId" INTEGER NOT NULL,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "validado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UsuarioHabilidade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsuarioHabilidade_habilidadeId_fkey" FOREIGN KEY ("habilidadeId") REFERENCES "Habilidade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "linkExterno" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Portfolio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjetoUsuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "dataRealizada" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjetoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjetoUsuarioHabilidade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projetoId" INTEGER NOT NULL,
    "habilidadeId" INTEGER NOT NULL,
    CONSTRAINT "ProjetoUsuarioHabilidade_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "ProjetoUsuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjetoUsuarioHabilidade_habilidadeId_fkey" FOREIGN KEY ("habilidadeId") REFERENCES "Habilidade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empresaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Pendente',
    "nivelMinimo" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Proposta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PropostaHabilidade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propostaId" INTEGER NOT NULL,
    "habilidadeId" INTEGER NOT NULL,
    "nivelMinimo" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "PropostaHabilidade_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "Proposta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropostaHabilidade_habilidadeId_fkey" FOREIGN KEY ("habilidadeId") REFERENCES "Habilidade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidaturaId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nota" REAL NOT NULL,
    "comentario" TEXT,
    "xpConcedido" INTEGER NOT NULL DEFAULT 0,
    "habilidadeId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Avaliacao_candidaturaId_fkey" FOREIGN KEY ("candidaturaId") REFERENCES "Candidatura" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Avaliacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Avaliacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_userId_key" ON "Empresa"("userId");

-- CreateIndex
CREATE INDEX "ProjetoEmpresa_empresaId_estado_idx" ON "ProjetoEmpresa"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Candidatura_usuarioId_idx" ON "Candidatura"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidatura_projetoId_usuarioId_key" ON "Candidatura"("projetoId", "usuarioId");

-- CreateIndex
CREATE INDEX "Formacao_usuarioId_idx" ON "Formacao"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Habilidade_nome_key" ON "Habilidade"("nome");

-- CreateIndex
CREATE INDEX "UsuarioHabilidade_usuarioId_idx" ON "UsuarioHabilidade"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioHabilidade_usuarioId_habilidadeId_key" ON "UsuarioHabilidade"("usuarioId", "habilidadeId");

-- CreateIndex
CREATE INDEX "Portfolio_usuarioId_ordem_idx" ON "Portfolio"("usuarioId", "ordem");

-- CreateIndex
CREATE INDEX "ProjetoUsuario_usuarioId_idx" ON "ProjetoUsuario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjetoUsuarioHabilidade_projetoId_habilidadeId_key" ON "ProjetoUsuarioHabilidade"("projetoId", "habilidadeId");

-- CreateIndex
CREATE INDEX "Proposta_usuarioId_estado_idx" ON "Proposta"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "Proposta_empresaId_idx" ON "Proposta"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "PropostaHabilidade_propostaId_habilidadeId_key" ON "PropostaHabilidade"("propostaId", "habilidadeId");

-- CreateIndex
CREATE INDEX "Avaliacao_usuarioId_idx" ON "Avaliacao"("usuarioId");

-- CreateIndex
CREATE INDEX "Avaliacao_candidaturaId_idx" ON "Avaliacao"("candidaturaId");
