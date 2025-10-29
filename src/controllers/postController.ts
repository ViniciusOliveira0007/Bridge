import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Criar postagem
export const criarPost = async (req: MulterRequest, res: Response) => {
  try {
    const { title, content, authorId } = req.body;
    const file = req.file;

    if (!title || !authorId) {
      return res.status(400).json({ error: "Título e autor são obrigatórios" });
    }

    const imageUrl = file ? `/uploads/${file.filename}` : null;

    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        imageUrl,
        authorId: Number(authorId),
        published: true,
      },
    });

    return res.status(201).json(newPost);
  } catch (error) {
    console.error("Erro criarPost:", error);
    return res.status(500).json({ error: "Erro ao criar o post" });
  }
};

// Listar postagens
export const listarPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar posts" });
  }
};
