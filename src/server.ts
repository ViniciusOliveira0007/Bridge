import multer from "multer";
import path from "path";
import * as fs from 'fs';
import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Controladores de autenticação
import { validateLogin, login, resetPassword } from "./controllers/authController";

// Controladores de posts
import { criarPost, listarPosts } from "./controllers/postController";

// Controladores de atividades
import { 
  criarAtividade, 
  listarAtividadesPorTurma, 
  buscarAtividade,
  entregarAtividade,
  listarAtividadesAluno,
} from "./controllers/atividadeController";

// Controlador de turmas
import { 
  getTurmas,
  getTurma,
  createTurma,
  updateTurma,
  deleteTurma,
  getMembros,
  addAlunoTurma,
  removeAlunoTurma,
  getCursos,
  getTurmasDoAluno,
  getTurmasDoProfessor
} from "./controllers/turmaController";

// Controlador de perfil
import { 
  atualizarFotoPerfil, 
  buscarUsuario, 
  removerFotoPerfil 
} from "./controllers/perfilController";

// Controlador de SMS
import { 
  enviarCodigoSMS, 
  verificarCodigoSMS 
} from "./controllers/smsController";

// ✅ NOVO: Controlador de Presenças
import { 
  registrarPresenca, 
  estatisticasPresencaAluno,
  presencasPorTurma,
  presencaPorData,
  atualizarPresenca
} from "./controllers/presencaController";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// ========================================
// CRIAR PASTA UPLOADS
// ========================================
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Pasta uploads criada');
}

// ========================================
// RATE LIMITING
// ========================================
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5000,
});

// ========================================
// MIDDLEWARES
// ========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "http://localhost:3000", "blob:"],
      },
    },
  })
);

// ========================================
// SERVIR ARQUIVOS ESTÁTICOS
// ========================================
app.use(express.static("public"));
app.use("/telas", express.static("telas"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ========================================
// CONFIGURAÇÃO DO MULTER PARA POSTS
// ========================================
const storagePost = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilterPost = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Apenas arquivos de imagem são permitidos"));
  } else {
    cb(null, true);
  }
};

const uploadPost = multer({
  storage: storagePost,
  fileFilter: fileFilterPost,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ========================================
// CONFIGURAÇÃO DO MULTER PARA PERFIL
// ========================================
const storagePerfil = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const unique = `perfil-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilterPerfil = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Apenas imagens são permitidas para foto de perfil"));
  } else {
    cb(null, true);
  }
};

const uploadPerfil = multer({
  storage: storagePerfil,
  fileFilter: fileFilterPerfil,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB para perfil
});

// ========================================
// ROTAS
// ========================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "home.html"));
});

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$connect();
    res.json({
      status: "OK",
      database: "Connected",
      message: "Bridge Platform API funcionando!",
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      database: "Disconnected",
    });
  }
});

// ========================================
// ROTAS DE AUTENTICAÇÃO
// ========================================
app.post("/api/validate-login", validateLogin);
app.post("/api/login", login);
app.post("/api/reset-password", resetPassword);

// ========================================
// ROTAS DE VERIFICAÇÃO SMS
// ========================================
app.post("/api/enviar-codigo-sms", enviarCodigoSMS);
app.post("/api/verificar-codigo-sms", verificarCodigoSMS);

// ========================================
// ROTAS DE USUÁRIO/PERFIL
// ========================================
app.get("/api/users/:userId", buscarUsuario);
app.post("/api/users/:userId/perfil", uploadPerfil.single("perfil"), atualizarFotoPerfil);
app.delete("/api/users/:userId/perfil", removerFotoPerfil);

// Rota para atualizar telefone do usuário
app.put("/api/users/:userId/telefone", async (req, res) => {
  try {
    const { userId } = req.params;
    const { telefone } = req.body;
    
    if (!telefone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telefone é obrigatório' 
      });
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { telefone },
      select: {
        id: true,
        name: true,
        email: true,
        telefone: true,
        role: true
      }
    });
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Erro ao atualizar telefone:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar telefone' 
    });
  }
});

// ========================================
// ROTAS DE POSTS
// ========================================
app.post("/api/posts", uploadPost.single("image"), criarPost);
app.get("/api/posts", listarPosts);

// ========================================
// ROTAS DE ATIVIDADES
// ========================================
app.post("/api/atividades", criarAtividade);
app.get("/api/atividades/turma/:turmaId", listarAtividadesPorTurma);
app.get("/api/atividades/aluno/:alunoId", listarAtividadesAluno);
app.get("/api/atividades/:id", buscarAtividade);
app.post("/api/atividades/:id/entregar", entregarAtividade);

// ========================================
// ROTAS DE TURMAS E CURSOS
// ========================================
// --- Cursos ---
app.get("/api/cursos", getCursos);

// --- Turmas (Operações CRUD) ---
app.get("/api/turmas", getTurmas);
app.post("/api/turmas", createTurma);
app.get("/api/turmas/:turmaId", getTurma);
app.put("/api/turmas/:turmaId", updateTurma);
app.delete("/api/turmas/:turmaId", deleteTurma);

// --- Membros da Turma (Alunos) ---
app.get("/api/turmas/:turmaId/membros", getMembros);
app.post("/api/turmas/:turmaId/membros", addAlunoTurma);
app.delete("/api/turmas/:turmaId/membros/:alunoId", removeAlunoTurma);

// --- Turmas Específicas de Usuários ---
app.get("/api/turmas/aluno/:alunoId", getTurmasDoAluno);
app.get("/api/turmas/professor/:professorId", getTurmasDoProfessor);

// ========================================
// ✅ ROTAS DE PRESENÇA (NOVO)
// ========================================
app.post("/api/presencas/registrar", registrarPresenca);
app.get("/api/presencas/aluno/:alunoId", estatisticasPresencaAluno);
app.get("/api/presencas/turma/:turmaId", presencasPorTurma);
app.get("/api/presencas/turma/:turmaId/data/:data", presencaPorData);
app.put("/api/presencas/:presencaId", atualizarPresenca);

// ========================================
// PLACEHOLDERS
// ========================================
app.get("/api/users", (req, res) => res.json({ message: "Rota para usuários - em desenvolvimento" }));
app.get("/api/teams", (req, res) => res.json({ message: "Rota para teams - em desenvolvimento" }));
app.get("/api/companies", (req, res) => res.json({ message: "Rota para empresas - em desenvolvimento" }));
app.get("/api/tests", (req, res) => res.json({ message: "Rota para testes - em desenvolvimento" }));

// ========================================
// INICIAR SERVIDOR
// ========================================
app.listen(PORT, () => {
  console.log(`🚀 Bridge Platform rodando em http://localhost:${PORT}`);
  console.log(`📊 API disponível em http://localhost:${PORT}/api/health`);
  console.log(`📱 SMS verification habilitado`);
  console.log(`✅ Sistema de Presenças ativo`);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("🔌 Desconectado do banco de dados");
  process.exit(0);
});