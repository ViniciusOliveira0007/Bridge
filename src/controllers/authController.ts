import { Request, Response } from 'express';
import { PrismaClient } from '../../ts/generated/prisma';

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
        message: 'Email inválido' 
      });
    }

    // Email existe! 
    return res.status(200).json({ 
      success: true,
      message: 'Email válido',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role  // ← ADICIONADO
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
        message: 'Senha incorreta' 
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
        name: user.name,
        role: user.role  // ← ADICIONADO
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

/**
 * Redefine a senha do usuário
 * @route POST /api/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, novaSenha } = req.body;

    // Validação 1: Verifica se email e nova senha foram enviados
    if (!email || !novaSenha) {
      return res.status(400).json({ 
        success: false,
        message: 'Email e nova senha são obrigatórios' 
      });
    }

    // Validação 2: Verifica requisitos da senha
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!senhaRegex.test(novaSenha)) {
      return res.status(400).json({ 
        success: false,
        message: 'A senha não atende aos requisitos de segurança' 
      });
    }

    // Busca o usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado' 
      });
    }

    // Atualiza a senha
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