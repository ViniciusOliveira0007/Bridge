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
exports.listarAtividadesAluno = exports.entregarAtividade = exports.buscarAtividade = exports.listarAtividadesPorTurma = exports.criarAtividade = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Professor cria uma nova atividade
 * POST /api/atividades
 */
const criarAtividade = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { titulo, descricao, dataEntrega, turmaId, professorId } = req.body;
        // Validações
        if (!titulo || !turmaId || !professorId) {
            return res.status(400).json({
                success: false,
                message: 'Título, turmaId e professorId são obrigatórios'
            });
        }
        // Verifica se o usuário é professor
        const professor = yield prisma.user.findUnique({
            where: { id: professorId }
        });
        if (!professor || professor.role !== 'professor') {
            return res.status(403).json({
                success: false,
                message: 'Apenas professores podem criar atividades'
            });
        }
        // Verifica se a turma existe
        const turma = yield prisma.turma.findUnique({
            where: { id: turmaId }
        });
        if (!turma) {
            return res.status(404).json({
                success: false,
                message: 'Turma não encontrada'
            });
        }
        // Cria a atividade
        const atividade = yield prisma.atividade.create({
            data: {
                titulo,
                descricao,
                dataEntrega: dataEntrega ? new Date(dataEntrega) : null,
                turmaId,
                professorId
            },
            include: {
                turma: {
                    select: {
                        nome: true,
                        curso: {
                            select: {
                                nome: true,
                                sigla: true
                            }
                        }
                    }
                },
                professor: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        return res.status(201).json({
            success: true,
            message: 'Atividade criada com sucesso',
            atividade
        });
    }
    catch (error) {
        console.error('Erro ao criar atividade:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.criarAtividade = criarAtividade;
/**
 * Lista todas as atividades de uma turma
 * GET /api/atividades/turma/:turmaId
 */
const listarAtividadesPorTurma = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { turmaId } = req.params;
        const atividades = yield prisma.atividade.findMany({
            where: {
                turmaId: parseInt(turmaId)
            },
            include: {
                professor: {
                    select: {
                        name: true
                    }
                },
                entregas: {
                    select: {
                        id: true,
                        alunoId: true,
                        dataEntrega: true
                    }
                },
                arquivos: true
            },
            orderBy: {
                dataEntrega: 'asc'
            }
        });
        return res.status(200).json({
            success: true,
            atividades
        });
    }
    catch (error) {
        console.error('Erro ao listar atividades:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.listarAtividadesPorTurma = listarAtividadesPorTurma;
/**
 * Busca uma atividade específica
 * GET /api/atividades/:id
 */
const buscarAtividade = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const atividade = yield prisma.atividade.findUnique({
            where: { id: parseInt(id) },
            include: {
                turma: {
                    include: {
                        curso: true
                    }
                },
                professor: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                entregas: {
                    include: {
                        aluno: {
                            select: {
                                name: true,
                                email: true
                            }
                        },
                        arquivos: true
                    }
                },
                arquivos: true
            }
        });
        if (!atividade) {
            return res.status(404).json({
                success: false,
                message: 'Atividade não encontrada'
            });
        }
        return res.status(200).json({
            success: true,
            atividade
        });
    }
    catch (error) {
        console.error('Erro ao buscar atividade:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.buscarAtividade = buscarAtividade;
/**
 * Aluno faz entrega de uma atividade
 * POST /api/atividades/:id/entregar
 */
const entregarAtividade = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { alunoId, comentario } = req.body;
        // Validações
        if (!alunoId) {
            return res.status(400).json({
                success: false,
                message: 'alunoId é obrigatório'
            });
        }
        // Verifica se o usuário é aluno
        const aluno = yield prisma.user.findUnique({
            where: { id: alunoId }
        });
        if (!aluno || aluno.role !== 'aluno') {
            return res.status(403).json({
                success: false,
                message: 'Apenas alunos podem fazer entregas'
            });
        }
        // Verifica se a atividade existe
        const atividade = yield prisma.atividade.findUnique({
            where: { id: parseInt(id) }
        });
        if (!atividade) {
            return res.status(404).json({
                success: false,
                message: 'Atividade não encontrada'
            });
        }
        // Verifica se já existe entrega
        const entregaExistente = yield prisma.entrega.findUnique({
            where: {
                atividadeId_alunoId: {
                    atividadeId: parseInt(id),
                    alunoId: alunoId
                }
            }
        });
        if (entregaExistente) {
            return res.status(400).json({
                success: false,
                message: 'Você já enviou esta atividade'
            });
        }
        // Cria a entrega
        const entrega = yield prisma.entrega.create({
            data: {
                atividadeId: parseInt(id),
                alunoId,
                comentario: comentario || null
            },
            include: {
                atividade: {
                    select: {
                        titulo: true
                    }
                },
                aluno: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        return res.status(201).json({
            success: true,
            message: 'Atividade entregue com sucesso',
            entrega
        });
    }
    catch (error) {
        console.error('Erro ao entregar atividade:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.entregarAtividade = entregarAtividade;
/**
 * Lista atividades de um aluno específico
 * GET /api/atividades/aluno/:alunoId
 */
const listarAtividadesAluno = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { alunoId } = req.params;
        // Busca as turmas do aluno
        const turmasAluno = yield prisma.turmaAluno.findMany({
            where: { alunoId: parseInt(alunoId) },
            include: {
                turma: {
                    include: {
                        atividades: {
                            include: {
                                professor: {
                                    select: {
                                        name: true
                                    }
                                },
                                entregas: {
                                    where: {
                                        alunoId: parseInt(alunoId)
                                    }
                                }
                            },
                            orderBy: {
                                dataEntrega: 'asc'
                            }
                        }
                    }
                }
            }
        });
        // Formata as atividades (CORRIGIDO - adicionado tipos)
        const atividades = turmasAluno.flatMap((ta) => ta.turma.atividades.map((ativ) => (Object.assign(Object.assign({}, ativ), { turma: {
                id: ta.turma.id,
                nome: ta.turma.nome
            }, foiEntregue: ativ.entregas.length > 0 }))));
        return res.status(200).json({
            success: true,
            atividades
        });
    }
    catch (error) {
        console.error('Erro ao listar atividades do aluno:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.listarAtividadesAluno = listarAtividadesAluno;
