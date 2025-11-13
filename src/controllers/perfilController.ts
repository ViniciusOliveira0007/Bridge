import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * Atualiza a foto de perfil do usuário
 * POST /api/users/:userId/perfil
 */
export const atualizarFotoPerfil = async (req: MulterRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const file = req.file;

    // Validação: userId é obrigatório
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário é obrigatório'
      });
    }

    // Validação: arquivo é obrigatório
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem foi enviada'
      });
    }

    // Busca o usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      // Remove o arquivo enviado se o usuário não existir
      fs.unlinkSync(file.path);
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Remove a foto anterior se existir (e não for a padrão)
    if (user.perfilUrl && !user.perfilUrl.includes('foto_de_perfil.png')) {
      const caminhoAntigoCompleto = path.join(__dirname, '..', user.perfilUrl);
      if (fs.existsSync(caminhoAntigoCompleto)) {
        fs.unlinkSync(caminhoAntigoCompleto);
        console.log('🗑️ Foto anterior removida:', caminhoAntigoCompleto);
      }
    }

    // URL relativa da nova foto
    const novaPerfilUrl = `/uploads/${file.filename}`;

    // Atualiza o banco de dados com a nova URL
    const userAtualizado = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { perfilUrl: novaPerfilUrl },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        perfilUrl: true
      }
    });

    console.log('✅ Foto de perfil atualizada:', userAtualizado.perfilUrl);

    return res.status(200).json({
      success: true,
      message: 'Foto de perfil atualizada com sucesso',
      user: userAtualizado
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar foto de perfil:', error);
    
    // Remove o arquivo em caso de erro
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: 'Erro no servidor ao atualizar foto'
    });
  }
};

/**
 * Busca os dados do usuário incluindo foto de perfil
 * GET /api/users/:userId
 */
export const buscarUsuario = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário é obrigatório'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        perfilUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Remove a foto de perfil do usuário (volta para a padrão)
 * DELETE /api/users/:userId/perfil
 */
export const removerFotoPerfil = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário é obrigatório'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Remove o arquivo físico se existir
    if (user.perfilUrl && !user.perfilUrl.includes('foto_de_perfil.png')) {
      const caminhoCompleto = path.join(__dirname, '..', user.perfilUrl);
      if (fs.existsSync(caminhoCompleto)) {
        fs.unlinkSync(caminhoCompleto);
        console.log('🗑️ Foto removida:', caminhoCompleto);
      }
    }

    // Atualiza para null (usará a foto padrão no frontend)
    const userAtualizado = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { perfilUrl: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        perfilUrl: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Foto de perfil removida com sucesso',
      user: userAtualizado
    });

  } catch (error) {
    console.error('❌ Erro ao remover foto de perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

