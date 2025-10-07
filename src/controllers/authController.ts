import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const validateLogin = async (req: Request, res: Response) => {
  try {
    // Pega o email do body
    const { email } = req.body;

    // Verifica se o email foi enviado
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email é obrigatório' 
      });
    }

    // Busca o usuário no banco pelo email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Se não encontrou o usuário
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Email não encontrado' 
      });
    }

    // Email existe! 
    return res.status(200).json({ 
      success: true,
      message: 'Email válido',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Erro ao validar login:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro no servidor' 
    });
  }
};

// ← ADICIONE AQUI
export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ 
        success: false,
        message: 'Email e senha são obrigatórios' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Email ou senha incorretos' 
      });
    }

    if (user.senha !== senha) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou senha incorretos' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro no servidor' 
    });
  }
};