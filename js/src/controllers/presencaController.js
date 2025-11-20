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
exports.atualizarPresenca = exports.presencaPorData = exports.presencasPorTurma = exports.estatisticasPresencaAluno = exports.registrarPresenca = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Registrar presença de alunos em uma aula
 * POST /api/presencas/registrar
 */
const registrarPresenca = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { turmaId, professorId, data, presencas } = req.body;
        // presencas é um array: [{ alunoId: number, presente: boolean }]
        if (!turmaId || !professorId || !data || !presencas) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }
        // Verifica se o professor é dono da turma
        const turma = yield prisma.turma.findUnique({
            where: { id: parseInt(turmaId) }
        });
        if (!turma || turma.professorId !== parseInt(professorId)) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para registrar presença nesta turma'
            });
        }
        // Registra as presenças
        const registros = yield Promise.all(presencas.map((p) => prisma.presenca.create({
            data: {
                turmaId: parseInt(turmaId),
                alunoId: parseInt(String(p.alunoId)),
                data: new Date(data),
                presente: p.presente,
                professorId: parseInt(professorId)
            }
        })));
        return res.status(201).json({
            success: true,
            message: 'Presenças registradas com sucesso',
            registros
        });
    }
    catch (error) {
        console.error('Erro ao registrar presenças:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.registrarPresenca = registrarPresenca;
/**
 * Buscar estatísticas de presença de um aluno por turma
 * GET /api/presencas/aluno/:alunoId
 */
const estatisticasPresencaAluno = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { alunoId } = req.params;
        // Busca todas as turmas do aluno
        const turmasAluno = yield prisma.turmaAluno.findMany({
            where: { alunoId: parseInt(alunoId) },
            include: {
                turma: {
                    include: {
                        curso: true,
                        professor: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        // Para cada turma, calcula estatísticas de presença
        const estatisticas = yield Promise.all(turmasAluno.map((ta) => __awaiter(void 0, void 0, void 0, function* () {
            // Busca todas as presenças do aluno nesta turma
            const presencas = yield prisma.presenca.findMany({
                where: {
                    turmaId: ta.turmaId,
                    alunoId: parseInt(alunoId)
                },
                orderBy: {
                    data: 'asc'
                }
            });
            // Calcula estatísticas
            const totalAulas = presencas.length;
            const faltas = presencas.filter(p => !p.presente).length;
            const presentes = totalAulas - faltas;
            const frequenciaAtual = totalAulas > 0 ? (presentes / totalAulas) * 100 : 0;
            // Carga horária estimada (assumindo 2.5h por aula)
            const cargaHoraria = totalAulas * 2.5;
            const faltasPermitidas = Math.floor(totalAulas * 0.25); // 25% de faltas permitidas
            const frequenciaMinima = 75; // 75% de frequência mínima
            return {
                turma: {
                    id: ta.turma.id,
                    nome: ta.turma.nome,
                    sigla: ta.turma.sigla,
                    cor: ta.turma.cor,
                    corTexto: ta.turma.corTexto,
                    curso: ta.turma.curso.nome,
                    professor: ta.turma.professor.name
                },
                cargaHoraria,
                aulasDadas: totalAulas,
                faltas,
                faltasPermitidas,
                frequenciaAtual: Math.round(frequenciaAtual * 100) / 100,
                frequenciaMinima,
                status: frequenciaAtual >= frequenciaMinima ? 'REGULAR' : 'IRREGULAR'
            };
        })));
        return res.status(200).json({
            success: true,
            estatisticas
        });
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas de presença:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.estatisticasPresencaAluno = estatisticasPresencaAluno;
/**
 * Buscar presenças de uma turma específica (para o professor)
 * GET /api/presencas/turma/:turmaId
 */
const presencasPorTurma = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { turmaId } = req.params;
        const { professorId } = req.query;
        // Verifica se a turma existe e se o professor tem acesso
        const turma = yield prisma.turma.findUnique({
            where: { id: parseInt(turmaId) },
            include: {
                curso: true,
                alunos: {
                    include: {
                        aluno: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                perfilUrl: true
                            }
                        }
                    }
                }
            }
        });
        if (!turma) {
            return res.status(404).json({
                success: false,
                message: 'Turma não encontrada'
            });
        }
        if (professorId && turma.professorId !== parseInt(professorId)) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para acessar esta turma'
            });
        }
        // Busca todas as presenças da turma
        const presencas = yield prisma.presenca.findMany({
            where: { turmaId: parseInt(turmaId) },
            orderBy: {
                data: 'desc'
            }
        });
        // Agrupa presenças por aluno
        const estatisticasPorAluno = turma.alunos.map(ta => {
            const presencasAluno = presencas.filter(p => p.alunoId === ta.alunoId);
            const totalAulas = presencasAluno.length;
            const faltas = presencasAluno.filter(p => !p.presente).length;
            const presentes = totalAulas - faltas;
            const frequencia = totalAulas > 0 ? (presentes / totalAulas) * 100 : 0;
            return {
                aluno: ta.aluno,
                totalAulas,
                presentes,
                faltas,
                frequencia: Math.round(frequencia * 100) / 100,
                status: frequencia >= 75 ? 'REGULAR' : 'IRREGULAR'
            };
        });
        // Busca datas únicas de aulas
        const datasAulas = [...new Set(presencas.map(p => p.data.toISOString().split('T')[0]))];
        return res.status(200).json({
            success: true,
            turma: {
                id: turma.id,
                nome: turma.nome,
                sigla: turma.sigla,
                curso: turma.curso.nome
            },
            estatisticasPorAluno,
            datasAulas: datasAulas.sort().reverse(),
            totalAulas: datasAulas.length
        });
    }
    catch (error) {
        console.error('Erro ao buscar presenças da turma:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.presencasPorTurma = presencasPorTurma;
/**
 * Buscar presença de uma data específica
 * GET /api/presencas/turma/:turmaId/data/:data
 */
const presencaPorData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { turmaId, data } = req.params;
        const presencas = yield prisma.presenca.findMany({
            where: {
                turmaId: parseInt(turmaId),
                data: new Date(data)
            },
            include: {
                aluno: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        perfilUrl: true
                    }
                }
            }
        });
        return res.status(200).json({
            success: true,
            presencas
        });
    }
    catch (error) {
        console.error('Erro ao buscar presença por data:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.presencaPorData = presencaPorData;
/**
 * Atualizar presença específica
 * PUT /api/presencas/:presencaId
 */
const atualizarPresenca = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { presencaId } = req.params;
        const { presente } = req.body;
        if (typeof presente !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Campo "presente" deve ser boolean'
            });
        }
        const presencaAtualizada = yield prisma.presenca.update({
            where: { id: parseInt(presencaId) },
            data: { presente }
        });
        return res.status(200).json({
            success: true,
            message: 'Presença atualizada com sucesso',
            presenca: presencaAtualizada
        });
    }
    catch (error) {
        console.error('Erro ao atualizar presença:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor'
        });
    }
});
exports.atualizarPresenca = atualizarPresenca;
// Exportações explícitas (para compatibilidade TypeScript)
exports.default = {
    registrarPresenca: exports.registrarPresenca,
    estatisticasPresencaAluno: exports.estatisticasPresencaAluno,
    presencasPorTurma: exports.presencasPorTurma,
    presencaPorData: exports.presencaPorData,
    atualizarPresenca: exports.atualizarPresenca
};
