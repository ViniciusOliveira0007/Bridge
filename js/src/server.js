"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Controladores de autenticação
const authController_1 = require("./controllers/authController");
// Controladores de posts
const postController_1 = require("./controllers/postController");
// Controladores de atividades
const atividadeController_1 = require("./controllers/atividadeController");
// Controlador de turmas
const turmaController_1 = require("./controllers/turmaController");
// Controlador de perfil
const perfilController_1 = require("./controllers/perfilController");
// Controlador de SMS
const smsController_1 = require("./controllers/smsController");
// ✅ NOVO: Controlador de Presenças
const presencaController_1 = require("./controllers/presencaController");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
// ========================================
// CRIAR PASTA UPLOADS
// ========================================
const uploadsDir = path_1.default.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Pasta uploads criada');
}
// ========================================
// RATE LIMITING
// ========================================
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 30 * 60 * 1000,
    max: 5000,
});
// ========================================
// MIDDLEWARES
// ========================================
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(limiter);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http://localhost:3000", "blob:"],
        },
    },
}));
// ========================================
// SERVIR ARQUIVOS ESTÁTICOS
// ========================================
app.use(express_1.default.static("public"));
app.use("/telas", express_1.default.static("telas"));
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "..", "uploads")));
// ========================================
// CONFIGURAÇÃO DO MULTER PARA POSTS
// ========================================
const storagePost = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, "..", "uploads"));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path_1.default.extname(file.originalname));
    },
});
const fileFilterPost = (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        cb(new Error("Apenas arquivos de imagem são permitidos"));
    }
    else {
        cb(null, true);
    }
};
const uploadPost = (0, multer_1.default)({
    storage: storagePost,
    fileFilter: fileFilterPost,
    limits: { fileSize: 5 * 1024 * 1024 },
});
// ========================================
// CONFIGURAÇÃO DO MULTER PARA PERFIL
// ========================================
const storagePerfil = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, "..", "uploads"));
    },
    filename: (req, file, cb) => {
        const unique = `perfil-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, unique + path_1.default.extname(file.originalname));
    },
});
const fileFilterPerfil = (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        cb(new Error("Apenas imagens são permitidas para foto de perfil"));
    }
    else {
        cb(null, true);
    }
};
const uploadPerfil = (0, multer_1.default)({
    storage: storagePerfil,
    fileFilter: fileFilterPerfil,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB para perfil
});
// ========================================
// ROTAS
// ========================================
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "public", "home.html"));
});
app.get("/api/health", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.$connect();
        res.json({
            status: "OK",
            database: "Connected",
            message: "Bridge Platform API funcionando!",
        });
    }
    catch (error) {
        res.status(500).json({
            status: "Error",
            database: "Disconnected",
        });
    }
}));
// ========================================
// ROTAS DE AUTENTICAÇÃO
// ========================================
app.post("/api/validate-login", authController_1.validateLogin);
app.post("/api/login", authController_1.login);
app.post("/api/reset-password", authController_1.resetPassword);
// ========================================
// ROTAS DE VERIFICAÇÃO SMS
// ========================================
app.post("/api/enviar-codigo-sms", smsController_1.enviarCodigoSMS);
app.post("/api/verificar-codigo-sms", smsController_1.verificarCodigoSMS);
// ========================================
// ROTAS DE USUÁRIO/PERFIL
// ========================================
app.get("/api/users/:userId", perfilController_1.buscarUsuario);
app.post("/api/users/:userId/perfil", uploadPerfil.single("perfil"), perfilController_1.atualizarFotoPerfil);
app.delete("/api/users/:userId/perfil", perfilController_1.removerFotoPerfil);
// Rota para atualizar telefone do usuário
app.put("/api/users/:userId/telefone", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { telefone } = req.body;
        if (!telefone) {
            return res.status(400).json({
                success: false,
                message: 'Telefone é obrigatório'
            });
        }
        const user = yield prisma.user.update({
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
    }
    catch (error) {
        console.error('Erro ao atualizar telefone:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar telefone'
        });
    }
}));
// ========================================
// ROTAS DE POSTS
// ========================================
app.post("/api/posts", uploadPost.single("image"), postController_1.criarPost);
app.get("/api/posts", postController_1.listarPosts);
// ========================================
// ROTAS DE ATIVIDADES
// ========================================
app.post("/api/atividades", atividadeController_1.criarAtividade);
app.get("/api/atividades/turma/:turmaId", atividadeController_1.listarAtividadesPorTurma);
app.get("/api/atividades/aluno/:alunoId", atividadeController_1.listarAtividadesAluno);
app.get("/api/atividades/:id", atividadeController_1.buscarAtividade);
app.post("/api/atividades/:id/entregar", atividadeController_1.entregarAtividade);
// ========================================
// ROTAS DE TURMAS E CURSOS
// ========================================
// --- Cursos ---
app.get("/api/cursos", turmaController_1.getCursos);
// --- Turmas (Operações CRUD) ---
app.get("/api/turmas", turmaController_1.getTurmas);
app.post("/api/turmas", turmaController_1.createTurma);
app.get("/api/turmas/:turmaId", turmaController_1.getTurma);
app.put("/api/turmas/:turmaId", turmaController_1.updateTurma);
app.delete("/api/turmas/:turmaId", turmaController_1.deleteTurma);
// --- Membros da Turma (Alunos) ---
app.get("/api/turmas/:turmaId/membros", turmaController_1.getMembros);
app.post("/api/turmas/:turmaId/membros", turmaController_1.addAlunoTurma);
app.delete("/api/turmas/:turmaId/membros/:alunoId", turmaController_1.removeAlunoTurma);
// --- Turmas Específicas de Usuários ---
app.get("/api/turmas/aluno/:alunoId", turmaController_1.getTurmasDoAluno);
app.get("/api/turmas/professor/:professorId", turmaController_1.getTurmasDoProfessor);
// ========================================
// ✅ ROTAS DE PRESENÇA (NOVO)
// ========================================
app.post("/api/presencas/registrar", presencaController_1.registrarPresenca);
app.get("/api/presencas/aluno/:alunoId", presencaController_1.estatisticasPresencaAluno);
app.get("/api/presencas/turma/:turmaId", presencaController_1.presencasPorTurma);
app.get("/api/presencas/turma/:turmaId/data/:data", presencaController_1.presencaPorData);
app.put("/api/presencas/:presencaId", presencaController_1.atualizarPresenca);
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
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
    console.log("🔌 Desconectado do banco de dados");
    process.exit(0);
}));
