import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET /api/turmas/:turmaId/membros
// Retorna todos os membros (professor + alunos) de uma turma
// ============================================
export const getMembros = async (req: Request, res: Response) => {
    try {
        const { turmaId } = req.params;
        
        console.log('🔍 Buscando membros da turma:', turmaId);
        
        // Validar turmaId
        const turmaIdNum = parseInt(turmaId);
        if (isNaN(turmaIdNum)) {
            return res.status(400).json({ 
                erro: 'ID da turma inválido' 
            });
        }
        
        // Buscar a turma com professor e alunos
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
        
        // Montar array de membros
        const membros = [];
        
        // Adicionar o professor
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
        
        // Adicionar os alunos
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
        
        console.log(`✅ ${membros.length} membros encontrados (1 professor + ${turma.alunos.length} alunos)`);
        
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