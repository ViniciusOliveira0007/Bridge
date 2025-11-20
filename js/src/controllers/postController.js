"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarPosts = exports.criarPost = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Criar postagem
const criarPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, authorId } = req.body;
        const file = req.file;
        if (!title || !authorId) {
            return res.status(400).json({ error: "Título e autor são obrigatórios" });
        }
        const imageUrl = file ? `/uploads/${file.filename}` : null;
        const newPost = yield prisma.post.create({
            data: {
                title,
                content,
                imageUrl,
                authorId: Number(authorId),
                published: true,
            },
        });
        return res.status(201).json(newPost);
    }
    catch (error) {
        console.error("Erro criarPost:", error);
        return res.status(500).json({ error: "Erro ao criar o post" });
    }
});
exports.criarPost = criarPost;
// Listar postagens
const listarPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield prisma.post.findMany({
            include: { author: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(posts);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao listar posts" });
    }
});
exports.listarPosts = listarPosts;
