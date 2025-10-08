import path from 'path';
import { PrismaClient } from "@prisma/client";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Importa o controlador de autenticação de login 
import { validateLogin, login, resetPassword } from './controllers/authController';




const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos (CORRIGIDO)
    max: 1000
});

// ========================================
// MIDDLEWARES - ORDEM CORRETA!
// ========================================
app.use(cors());
app.use(express.json()); // ← CRÍTICO: Antes das rotas!
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Servir arquivos estáticos
app.use(express.static('public'));
app.use('/telas', express.static('telas'));





// ========================================
// ROTAS
// ========================================

// Rota raiz serve o home.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'home.html'));
});

// API Health Check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      message: 'Bridge Platform API funcionando!' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected' 
    });
  }
});

// Rota para validar email
app.post('/api/validate-login', validateLogin);

// Rota para login completo (email + senha)
app.post('/api/login', login);


// Rota para redefinir senha
app.post('/api/reset-password', resetPassword);

// Placeholder routes para suas funcionalidades
app.get('/api/users', (req, res) => {
  res.json({ message: 'Rota para usuários - em desenvolvimento' });
});

app.get('/api/teams', (req, res) => {
  res.json({ message: 'Rota para teams - em desenvolvimento' });
});

app.get('/api/companies', (req, res) => {
  res.json({ message: 'Rota para empresas - em desenvolvimento' });
});

app.get('/api/tests', (req, res) => {
  res.json({ message: 'Rota para testes - em desenvolvimento' });
});

// ========================================
// INICIAR SERVIDOR
// ========================================
app.listen(PORT, () => {
  console.log(`🚀 Bridge Platform rodando em http://localhost:${PORT}`);
  console.log(`📊 API disponível em http://localhost:${PORT}/api/health`);
});



// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('🔌 Desconectado do banco de dados');
  process.exit(0);
});