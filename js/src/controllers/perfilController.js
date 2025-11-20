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
Object.defineProperty(exports, "__esModule", { value: true });
exports.removerFotoPerfil = exports.buscarUsuario = exports.atualizarFotoPerfil = void 0;
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
/**
 * Atualiza a foto de perfil do usuário
 * POST /api/users/:userId/perfil
 */
const atualizarFotoPerfil = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield prisma.user.findUnique({
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
        const userAtualizado = yield prisma.user.update({
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
    }
    catch (error) {
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
});
exports.atualizarFotoPerfil = atualizarFotoPerfil;
/**
 * Busca os dados do usuário incluindo foto de perfil
 * GET /api/users/:userId
 */
const buscarUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'ID do usuário é obrigatório'
            });
        }
        const user = yield prisma.user.findUnique({
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
    }
    catch (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.buscarUsuario = buscarUsuario;
/**
 * Remove a foto de perfil do usuário (volta para a padrão)
 * DELETE /api/users/:userId/perfil
 */
const removerFotoPerfil = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'ID do usuário é obrigatório'
            });
        }
        const user = yield prisma.user.findUnique({
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
        const userAtualizado = yield prisma.user.update({
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
    }
    catch (error) {
        console.error('❌ Erro ao remover foto de perfil:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.removerFotoPerfil = removerFotoPerfil;
