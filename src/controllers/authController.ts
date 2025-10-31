import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const validateLogin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email é obrigatório' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        perfilUrl: true // ← NOVO
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Email inválido' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Email válido',
      user: user
    });

  } catch (error) {
    console.error('Erro ao validar login:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro no servidor' 
    });
  }
};

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
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        senha: true,
        role: true,
        perfilUrl: true // ← NOVO
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Senha incorreta' 
      });
    }

    if (user.senha !== senha) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou senha incorretos' 
      });
    }

    // Remove a senha antes de enviar
    const { senha: _, ...userSemSenha } = user;

    return res.status(200).json({ 
      success: true,
      message: 'Login realizado com sucesso',
      user: userSemSenha
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro no servidor' 
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, novaSenha } = req.body;

    if (!email || !novaSenha) {
      return res.status(400).json({ 
        success: false,
        message: 'Email e nova senha são obrigatórios' 
      });
    }

    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!senhaRegex.test(novaSenha)) {
      return res.status(400).json({ 
        success: false,
        message: 'A senha não atende aos requisitos de segurança' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado' 
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { senha: novaSenha }
    });

    return res.status(200).json({ 
      success: true,
      message: 'Senha redefinida com sucesso!' 
    });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro no servidor' 
    });
  }
};