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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.login = exports.validateLogin = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const validateLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email é obrigatório'
            });
        }
        const user = yield prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                perfilUrl: true,
                telefone: true
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
    }
    catch (error) {
        console.error('Erro ao validar login:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.validateLogin = validateLogin;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }
        const user = yield prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: {
                id: true,
                email: true,
                name: true,
                senha: true,
                role: true,
                perfilUrl: true,
                telefone: true // ✅ CORRIGIDO: Agora retorna o telefone
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
                message: 'Senha incorreta'
            });
        }
        // Remove a senha antes de enviar
        const { senha: _ } = user, userSemSenha = __rest(user, ["senha"]);
        // ✅ Debug: Mostra se o telefone está sendo retornado
        console.log('👤 Usuário autenticado:', {
            id: userSemSenha.id,
            name: userSemSenha.name,
            telefone: userSemSenha.telefone || 'SEM TELEFONE' // ← Vai ajudar no debug
        });
        return res.status(200).json({
            success: true,
            message: 'Login realizado com sucesso',
            user: userSemSenha
        });
    }
    catch (error) {
        console.error('Erro ao fazer login:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.login = login;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        yield prisma.user.update({
            where: { id: user.id },
            data: { senha: novaSenha }
        });
        return res.status(200).json({
            success: true,
            message: 'Senha redefinida com sucesso!'
        });
    }
    catch (error) {
        console.error('Erro ao redefinir senha:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.resetPassword = resetPassword;
