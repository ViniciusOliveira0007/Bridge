import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Professor cria uma nova atividade
 * POST /api/atividades
 */
export const criarAtividade = async (req: Request, res: Response) => {
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
    const professor = await prisma.user.findUnique({
      where: { id: professorId }
    });

    if (!professor || professor.role !== 'professor') {
      return res.status(403).json({
        success: false,
        message: 'Apenas professores podem criar atividades'
      });
    }

    // Verifica se a turma existe
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId }
    });

    if (!turma) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Cria a atividade
    const atividade = await prisma.atividade.create({
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

  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Lista todas as atividades de uma turma
 * GET /api/atividades/turma/:turmaId
 */
export const listarAtividadesPorTurma = async (req: Request, res: Response) => {
  try {
    const { turmaId } = req.params;

    const atividades = await prisma.atividade.findMany({
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

  } catch (error) {
    console.error('Erro ao listar atividades:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Busca uma atividade específica
 * GET /api/atividades/:id
 */
export const buscarAtividade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const atividade = await prisma.atividade.findUnique({
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

  } catch (error) {
    console.error('Erro ao buscar atividade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Aluno faz entrega de uma atividade
 * POST /api/atividades/:id/entregar
 */
export const entregarAtividade = async (req: Request, res: Response) => {
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
    const aluno = await prisma.user.findUnique({
      where: { id: alunoId }
    });

    if (!aluno || aluno.role !== 'aluno') {
      return res.status(403).json({
        success: false,
        message: 'Apenas alunos podem fazer entregas'
      });
    }

    // Verifica se a atividade existe
    const atividade = await prisma.atividade.findUnique({
      where: { id: parseInt(id) }
    });

    if (!atividade) {
      return res.status(404).json({
        success: false,
        message: 'Atividade não encontrada'
      });
    }

    // Verifica se já existe entrega
    const entregaExistente = await prisma.entrega.findUnique({
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
    const entrega = await prisma.entrega.create({
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

  } catch (error) {
    console.error('Erro ao entregar atividade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Lista atividades de um aluno específico
 * GET /api/atividades/aluno/:alunoId
 */
export const listarAtividadesAluno = async (req: Request, res: Response) => {
  try {
    const { alunoId } = req.params;

    // Busca as turmas do aluno
    const turmasAluno = await prisma.turmaAluno.findMany({
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
    const atividades = turmasAluno.flatMap((ta: any) => 
      ta.turma.atividades.map((ativ: any) => ({
        ...ativ,
        turma: {
          id: ta.turma.id,
          nome: ta.turma.nome
        },
        foiEntregue: ativ.entregas.length > 0
      }))
    );

    return res.status(200).json({
      success: true,
      atividades
    });

  } catch (error) {
    console.error('Erro ao listar atividades do aluno:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};