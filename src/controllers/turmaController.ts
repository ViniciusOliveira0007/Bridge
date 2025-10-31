import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'; // ← CORRIGIR AQUI

const prisma = new PrismaClient();

export const getMembros = async (req: Request, res: Response) => {
    try {
        const { turmaId } = req.params;
        
        console.log('🔍 Buscando membros da turma:', turmaId);
        
        const turmaIdNum = parseInt(turmaId);
        if (isNaN(turmaIdNum)) {
            return res.status(400).json({ 
                erro: 'ID da turma inválido' 
            });
        }
        
        const turma = await prisma.turma.findUnique({
            where: {
                id: turmaIdNum
            },
            include: {
                professor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                alunos: {
                    include: {
                        aluno: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });
        
        if (!turma) {
            console.log('❌ Turma não encontrada');
            return res.status(404).json({ 
                erro: 'Turma não encontrada' 
            });
        }
        
        console.log('✅ Turma encontrada:', turma.nome);
        
        const membros = [];
        
        if (turma.professor) {
            membros.push({
                id: turma.professor.id,
                nome: turma.professor.name || 'Professor',
                email: turma.professor.email,
                tipo: 'professor',
                role: turma.professor.role,
                avatar: null,
                matricula: null
            });
        }
        
        turma.alunos.forEach(turmaAluno => {
            membros.push({
                id: turmaAluno.aluno.id,
                nome: turmaAluno.aluno.name || 'Aluno',
                email: turmaAluno.aluno.email,
                tipo: 'aluno',
                role: turmaAluno.aluno.role,
                avatar: null,
                matricula: null
            });
        });
        
        console.log(`✅ ${membros.length} membros encontrados`);
        
        res.json({
            sucesso: true,
            membros: membros,
            total: membros.length,
            turma: {
                id: turma.id,
                nome: turma.nome,
                descricao: turma.descricao
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar membros:', error);
        res.status(500).json({ 
            erro: 'Erro ao buscar membros da turma',
            detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// Adicione ao turmaController.ts

// GET /api/turmas - Listar todas as turmas
export const getTurmas = async (req: Request, res: Response) => {
    try {
        const turmas = await prisma.turma.findMany({
            include: {
                curso: true,
                professor: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        alunos: true,
                        atividades: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            sucesso: true,
            turmas: turmas
        });
    } catch (error) {
        console.error('Erro ao listar turmas:', error);
        res.status(500).json({ erro: 'Erro ao listar turmas' });
    }
};

// POST /api/turmas - Criar nova turma
export const createTurma = async (req: Request, res: Response) => {
    try {
        const { nome, sigla, cursoId, professorId, descricao } = req.body;

        if (!nome || !cursoId || !professorId) {
            return res.status(400).json({
                erro: 'Nome, cursoId e professorId são obrigatórios'
            });
        }

        const novaTurma = await prisma.turma.create({
            data: {
                nome,
                descricao,
                cursoId,
                professorId
            },
            include: {
                curso: true,
                professor: {
                    select: {
                        name: true
                    }
                }
            }
        });

        res.status(201).json({
            sucesso: true,
            turma: novaTurma
        });
    } catch (error) {
        console.error('Erro ao criar turma:', error);
        res.status(500).json({ erro: 'Erro ao criar turma' });
    }
};

// GET /api/cursos - Listar todos os cursos
export const getCursos = async (req: Request, res: Response) => {
    try {
        const cursos = await prisma.curso.findMany({
            orderBy: {
                nome: 'asc'
            }
        });

        res.json({
            sucesso: true,
            cursos: cursos
        });
    } catch (error) {
        console.error('Erro ao listar cursos:', error);
        res.status(500).json({ erro: 'Erro ao listar cursos' });
    }
};