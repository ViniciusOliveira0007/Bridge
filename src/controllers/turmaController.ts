import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ========================================
// LISTAR TODAS AS TURMAS
// ========================================
export async function getTurmas(req: Request, res: Response) {
  try {
    const turmas = await prisma.turma.findMany({
      include: {
        curso: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            descricao: true
          }
        },
        professor: {
          select: {
            id: true,
            name: true,
            email: true,
            perfilUrl: true
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

    console.log(`✅ ${turmas.length} turmas encontradas`);

    res.json({ turmas });
  } catch (error) {
    console.error("❌ Erro ao buscar turmas:", error);
    res.status(500).json({ 
      error: "Erro ao buscar turmas",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// ========================================
// BUSCAR UMA TURMA ESPECÍFICA
// ========================================
export async function getTurma(req: Request, res: Response) {
  try {
    const { turmaId } = req.params;

    const turma = await prisma.turma.findUnique({
      where: {
        id: parseInt(turmaId)
      },
      include: {
        curso: true,
        professor: {
          select: {
            id: true,
            name: true,
            email: true,
            perfilUrl: true
          }
        },
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
        },
        atividades: {
          orderBy: {
            dataEntrega: 'asc'
          }
        },
        _count: {
          select: {
            alunos: true,
            atividades: true
          }
        }
      }
    });

    if (!turma) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    console.log(`✅ Turma encontrada: ${turma.nome}`);

    res.json({ turma });
  } catch (error) {
    console.error("❌ Erro ao buscar turma:", error);
    res.status(500).json({ 
      error: "Erro ao buscar turma",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// ========================================
// CRIAR NOVA TURMA
// ========================================
export async function createTurma(req: Request, res: Response) {
  try {
    const { nome, sigla, cursoId, professorId, descricao, cor, corTexto } = req.body;

    console.log("📥 Dados recebidos para criar turma:", { 
      nome, 
      sigla, 
      cursoId, 
      professorId, 
      descricao, 
      cor, 
      corTexto 
    });

    // ========================================
    // VALIDAÇÕES
    // ========================================
    if (!nome || !sigla || !cursoId || !professorId) {
      return res.status(400).json({ 
        error: "Campos obrigatórios faltando",
        required: ["nome", "sigla", "cursoId", "professorId"],
        received: { nome, sigla, cursoId, professorId }
      });
    }

    // Validar sigla (máximo 4 caracteres)
    if (sigla.length > 4) {
      return res.status(400).json({ 
        error: "A sigla deve ter no máximo 4 caracteres",
        received: sigla,
        length: sigla.length
      });
    }

    // Validar formato de cor (hex)
    if (cor && !/^#[0-9A-F]{6}$/i.test(cor)) {
      return res.status(400).json({ 
        error: "Formato de cor inválido. Use formato hexadecimal (#RRGGBB)",
        received: cor
      });
    }

    if (corTexto && !/^#[0-9A-F]{6}$/i.test(corTexto)) {
      return res.status(400).json({ 
        error: "Formato de cor do texto inválido. Use formato hexadecimal (#RRGGBB)",
        received: corTexto
      });
    }

    // ========================================
    // VERIFICAR SE CURSO E PROFESSOR EXISTEM
    // ========================================
    const curso = await prisma.curso.findUnique({
      where: { id: parseInt(cursoId) }
    });

    if (!curso) {
      return res.status(404).json({ 
        error: "Curso não encontrado",
        cursoId 
      });
    }

    const professor = await prisma.user.findUnique({
      where: { id: parseInt(professorId) }
    });

    if (!professor) {
      return res.status(404).json({ 
        error: "Professor não encontrado",
        professorId 
      });
    }

    if (professor.role !== 'professor') {
      return res.status(403).json({ 
        error: "Usuário não possui permissão de professor",
        role: professor.role 
      });
    }

    // ========================================
    // CRIAR A TURMA
    // ========================================
    const novaTurma = await prisma.turma.create({
      data: {
        nome: nome.trim(),
        sigla: sigla.toUpperCase().trim(),
        descricao: descricao ? descricao.trim() : null,
        cor: cor || "#FF6B6B",
        corTexto: corTexto || "#FFFFFF",
        cursoId: parseInt(cursoId),
        professorId: parseInt(professorId)
      },
      include: {
        curso: {
          select: {
            id: true,
            nome: true,
            sigla: true
          }
        },
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log("✅ Turma criada com sucesso:", {
      id: novaTurma.id,
      nome: novaTurma.nome,
      sigla: novaTurma.sigla,
      cor: novaTurma.cor,
      corTexto: novaTurma.corTexto
    });

    res.status(201).json({ 
      success: true, 
      message: "Turma criada com sucesso",
      turma: novaTurma 
    });

  } catch (error) {
    console.error("❌ Erro ao criar turma:", error);
    res.status(500).json({ 
      error: "Erro ao criar turma",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// ========================================
// ATUALIZAR TURMA
// ========================================
export async function updateTurma(req: Request, res: Response) {
  try {
    const { turmaId } = req.params;
    const { nome, sigla, descricao, cor, corTexto } = req.body;

    console.log("📝 Atualizando turma:", turmaId, req.body);

    // Verificar se a turma existe
    const turmaExistente = await prisma.turma.findUnique({
      where: { id: parseInt(turmaId) }
    });

    if (!turmaExistente) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    // Validar sigla se fornecida
    if (sigla && sigla.length > 4) {
      return res.status(400).json({ 
        error: "A sigla deve ter no máximo 4 caracteres" 
      });
    }

    // Atualizar a turma
    const turmaAtualizada = await prisma.turma.update({
      where: { id: parseInt(turmaId) },
      data: {
        ...(nome && { nome: nome.trim() }),
        ...(sigla && { sigla: sigla.toUpperCase().trim() }),
        ...(descricao !== undefined && { descricao: descricao ? descricao.trim() : null }),
        ...(cor && { cor }),
        ...(corTexto && { corTexto })
      },
      include: {
        curso: true,
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log("✅ Turma atualizada com sucesso:", turmaAtualizada.id);

    res.json({ 
      success: true, 
      message: "Turma atualizada com sucesso",
      turma: turmaAtualizada 
    });

  } catch (error) {
    console.error("❌ Erro ao atualizar turma:", error);
    res.status(500).json({ 
      error: "Erro ao atualizar turma",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// ========================================
// DELETAR TURMA
// ========================================
export async function deleteTurma(req: Request, res: Response) {
  try {
    const { turmaId } = req.params;

    console.log("🗑️ Deletando turma:", turmaId);

    // Verificar se a turma existe
    const turmaExistente = await prisma.turma.findUnique({
      where: { id: parseInt(turmaId) },
      include: {
        _count: {
          select: {
            alunos: true,
            atividades: true
          }
        }
      }
    });

    if (!turmaExistente) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    // Avisar se há dados relacionados
    if (turmaExistente._count.alunos > 0 || turmaExistente._count.atividades > 0) {
      console.warn("⚠️ Turma possui dados relacionados:", {
        alunos: turmaExistente._count.alunos,
        atividades: turmaExistente._count.atividades
      });
    }

    // Deletar a turma (cascata será configurada no Prisma)
    await prisma.turma.delete({
      where: { id: parseInt(turmaId) }
    });

    console.log("✅ Turma deletada com sucesso:", turmaId);

    res.json({ 
      success: true, 
      message: "Turma deletada com sucesso" 
    });

  } catch (error) {
    console.error("❌ Erro ao deletar turma:", error);
    res.status(500).json({ 
      error: "Erro ao deletar turma",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// ========================================
// BUSCAR MEMBROS DE UMA TURMA
// ========================================
export async function getMembros(req: Request, res: Response) {
  try {
    const { turmaId } = req.params;

    console.log("👥 Buscando membros da turma:", turmaId);

    const membros = await prisma.turmaAluno.findMany({
      where: {
        turmaId: parseInt(turmaId)
      },
      include: {
        aluno: {
          select: {
            id: true,
            name: true,
            email: true,
            perfilUrl: true,
            role: true
          }
        }
      },
      orderBy: {
        aluno: {
          name: 'asc'
        }
      }
    });

    console.log(`✅ ${membros.length} membros encontrados`);

    res.json({ 
      membros,
      total: membros.length
    });

  } catch (error) {
    console.error("❌ Erro ao buscar membros:", error);
    res.status(500).json({ 
      error: "Erro ao buscar membros",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// ========================================
// ADICIONAR ALUNO À TURMA
// ========================================
export async function addAlunoTurma(req: Request, res: Response) {
  try {
    const { turmaId } = req.params;
    const { alunoId } = req.body;

    console.log("➕ Adicionando aluno à turma:", { turmaId, alunoId });

    if (!alunoId) {
      return res.status(400).json({ error: "alunoId é obrigatório" });
    }

    // Verificar se turma existe
    const turma = await prisma.turma.findUnique({
      where: { id: parseInt(turmaId) }
    });

    if (!turma) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    // Verificar se aluno existe
    const aluno = await prisma.user.findUnique({
      where: { id: parseInt(alunoId) }
    });

    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }

    // Verificar se aluno já está na turma
    const jaInscrito = await prisma.turmaAluno.findUnique({
      where: {
        turmaId_alunoId: {
          turmaId: parseInt(turmaId),
          alunoId: parseInt(alunoId)
        }
      }
    });

    if (jaInscrito) {
      return res.status(400).json({ error: "Aluno já está inscrito nesta turma" });
    }

    // Adicionar aluno à turma
    const inscricao = await prisma.turmaAluno.create({
      data: {
        turmaId: parseInt(turmaId),
        alunoId: parseInt(alunoId)
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

    console.log("✅ Aluno adicionado com sucesso");

    res.status(201).json({ 
      success: true,
      message: "Aluno adicionado à turma com sucesso",
      inscricao 
    });

  } catch (error) {
    console.error("❌ Erro ao adicionar aluno:", error);
    res.status(500).json({ 
      error: "Erro ao adicionar aluno à turma",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// ========================================
// REMOVER ALUNO DA TURMA
// ========================================
export async function removeAlunoTurma(req: Request, res: Response) {
  try {
    const { turmaId, alunoId } = req.params;

    console.log("➖ Removendo aluno da turma:", { turmaId, alunoId });

    // Verificar se a inscrição existe
    const inscricao = await prisma.turmaAluno.findUnique({
      where: {
        turmaId_alunoId: {
          turmaId: parseInt(turmaId),
          alunoId: parseInt(alunoId)
        }
      }
    });

    if (!inscricao) {
      return res.status(404).json({ error: "Aluno não está inscrito nesta turma" });
    }

    // Remover aluno da turma
    await prisma.turmaAluno.delete({
      where: {
        turmaId_alunoId: {
          turmaId: parseInt(turmaId),
          alunoId: parseInt(alunoId)
        }
      }
    });

    console.log("✅ Aluno removido com sucesso");

    res.json({ 
      success: true,
      message: "Aluno removido da turma com sucesso"
    });

  } catch (error) {
    console.error("❌ Erro ao remover aluno:", error);
    res.status(500).json({ 
      error: "Erro ao remover aluno da turma",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// ========================================
// LISTAR TODOS OS CURSOS
// ========================================
export async function getCursos(req: Request, res: Response) {
  try {
    const cursos = await prisma.curso.findMany({
      include: {
        _count: {
          select: {
            turmas: true
          }
        }
      },
      orderBy: {
        nome: 'asc'
      }
    });

    console.log(`✅ ${cursos.length} cursos encontrados`);

    res.json({ cursos });

  } catch (error) {
    console.error("❌ Erro ao buscar cursos:", error);
    res.status(500).json({ 
      error: "Erro ao buscar cursos",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// ========================================
// BUSCAR TURMAS DE UM ALUNO ESPECÍFICO
// ========================================
export async function getTurmasDoAluno(req: Request, res: Response) {
  try {
    const { alunoId } = req.params;

    console.log("📚 Buscando turmas do aluno:", alunoId);

    const turmasDoAluno = await prisma.turmaAluno.findMany({
      where: {
        alunoId: parseInt(alunoId)
      },
      include: {
        turma: {
          include: {
            curso: true,
            professor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                alunos: true,
                atividades: true
              }
            }
          }
        }
      },
      orderBy: {
        entryAt: 'desc'
      }
    });

    console.log(`✅ ${turmasDoAluno.length} turmas encontradas para o aluno`);

    res.json({ 
      turmas: turmasDoAluno.map(ta => ta.turma),
      total: turmasDoAluno.length
    });

  } catch (error) {
    console.error("❌ Erro ao buscar turmas do aluno:", error);
    res.status(500).json({ 
      error: "Erro ao buscar turmas do aluno",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// ========================================
// BUSCAR TURMAS DE UM PROFESSOR ESPECÍFICO
// ========================================
export async function getTurmasDoProfessor(req: Request, res: Response) {
  try {
    const { professorId } = req.params;

    console.log("📚 Buscando turmas do professor:", professorId);

    const turmasDoProfessor = await prisma.turma.findMany({
      where: {
        professorId: parseInt(professorId)
      },
      include: {
        curso: true,
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

    console.log(`✅ ${turmasDoProfessor.length} turmas encontradas para o professor`);

    res.json({ 
      turmas: turmasDoProfessor,
      total: turmasDoProfessor.length
    });

  } catch (error) {
    console.error("❌ Erro ao buscar turmas do professor:", error);
    res.status(500).json({ 
      error: "Erro ao buscar turmas do professor",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}