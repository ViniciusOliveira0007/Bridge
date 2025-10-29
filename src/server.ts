import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Controladores existentes
import { validateLogin, login, resetPassword } from "./controllers/authController";
import { criarPost, listarPosts } from "./controllers/postController";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// ========================================
// RATE LIMITING
// ========================================
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutos
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
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "http://localhost:3000"],
      },
    },
  })
);

// ========================================
// SERVIR ARQUIVOS ESTÁTICOS
// ========================================
app.use(express.static("public"));
app.use("/telas", express.static("telas"));

// pasta onde as imagens enviadas serão salvas
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ========================================
// CONFIGURAÇÃO DO MULTER (UPLOAD DE IMAGENS)
// ========================================

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads")); // salva na pasta /uploads
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname)); // ex: 1698567801234-123456789.png
  },
});

// Filtro para aceitar apenas imagens
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Apenas arquivos de imagem são permitidos"));
  } else {
    cb(null, true);
  }
};

// Inicializa o multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // limite: 5 MB
});

// ========================================
// ROTAS
// ========================================

// Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "home.html"));
});

// Health Check
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
// ROTAS DE POSTS (COM UPLOAD DE IMAGEM)
// ========================================

// Cria post com imagem (campo 'image' do formulário)
app.post("/api/posts", upload.single("image"), criarPost);

// Lista posts
app.get("/api/posts", listarPosts);

// ========================================
// PLACEHOLDERS (rotas futuras)
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
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("🔌 Desconectado do banco de dados");
  process.exit(0);
});
