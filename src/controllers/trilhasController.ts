import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// PROJETOS DA EMPRESA (EXPLORAR)
// ============================================

/**
 * Listar todos os projetos disponíveis (feed principal)
 * GET /api/trilhas/projetos
 */
export const listarProjetosDisponiveis = async (req: Request, res: Response) => {
  try {
    const { categoria, estado, userId } = req.query;

    const projetos = await prisma.projetoEmpresa.findMany({
      where: {
        ...(categoria && { categoria: categoria as string }),
        ...(estado && { estado: estado as string }),
        vagasPreenchidas: { lt: prisma.projetoEmpresa.fields.vagasTotal }
      },
      include: {
        empresa: {
          include: {
            user: {
              select: {
                name: true,
                perfilUrl: true
              }
            }
          }
        },
        habilidadesRequeridas: {
          include: {
            habilidade: true
          }
        },
        candidaturas: {
          ...(userId && {
            where: {
              usuarioId: parseInt(userId as string)
            }
          }),
          select: {
            id: true,
            usuarioId: true,
            status: true
          }
        },
        _count: {
          select: {
            candidaturas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      projetos
    });

  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Criar novo projeto (apenas empresas)
 * POST /api/trilhas/projetos
 */
export const criarProjeto = async (req: Request, res: Response) => {
  try {
    const { 
      empresaId, 
      nome, 
      descricao, 
      categoria, 
      prioridade,
      prazo,
      vagasTotal,
      imagemUrl,
      habilidadesRequeridas // [{ habilidadeId, nivelMinimo }]
    } = req.body;

    if (!empresaId || !nome) {
      return res.status(400).json({
        success: false,
        message: 'empresaId e nome são obrigatórios'
      });
    }

    // Verifica se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: parseInt(empresaId) }
    });

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }

    // Cria o projeto
    const projeto = await prisma.projetoEmpresa.create({
      data: {
        empresaId: parseInt(empresaId),
        nome,
        descricao,
        categoria,
        prioridade: prioridade || 'Media',
        prazo: prazo ? new Date(prazo) : null,
        vagasTotal: vagasTotal || 1,
        imagemUrl,
        habilidadesRequeridas: {
          create: habilidadesRequeridas?.map((h: any) => ({
            habilidadeId: parseInt(h.habilidadeId),
            nivelMinimo: h.nivelMinimo || 1
          })) || []
        }
      },
      include: {
        empresa: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        habilidadesRequeridas: {
          include: {
            habilidade: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Projeto criado com sucesso',
      projeto
    });

  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Buscar detalhes de um projeto
 * GET /api/trilhas/projetos/:projetoId
 */
export const buscarProjeto = async (req: Request, res: Response) => {
  try {
    const { projetoId } = req.params;

    const projeto = await prisma.projetoEmpresa.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: {
          include: {
            user: {
              select: {
                name: true,
                perfilUrl: true
              }
            }
          }
        },
        habilidadesRequeridas: {
          include: {
            habilidade: true
          }
        },
        candidaturas: {
          include: {
            usuario: {
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

    if (!projeto) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      projeto
    });

  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// ============================================
// CANDIDATURAS (ACEITAR PROPOSTAS)
// ============================================

/**
 * Candidatar-se a um projeto (Aceitar proposta)
 * POST /api/trilhas/candidaturas
 */
export const candidatarProjeto = async (req: Request, res: Response) => {
  try {
    const { projetoId, usuarioId } = req.body;

    if (!projetoId || !usuarioId) {
      return res.status(400).json({
        success: false,
        message: 'projetoId e usuarioId são obrigatórios'
      });
    }

    // Verifica se o projeto existe e tem vagas
    const projeto = await prisma.projetoEmpresa.findUnique({
      where: { id: parseInt(projetoId) }
    });

    if (!projeto) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    if (projeto.vagasPreenchidas >= projeto.vagasTotal) {
      return res.status(400).json({
        success: false,
        message: 'Projeto já está com todas as vagas preenchidas'
      });
    }

    // Verifica se já se candidatou
    const candidaturaExistente = await prisma.candidatura.findUnique({
      where: {
        projetoId_usuarioId: {
          projetoId: parseInt(projetoId),
          usuarioId: parseInt(usuarioId)
        }
      }
    });

    if (candidaturaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Você já se candidatou a este projeto'
      });
    }

    // Cria a candidatura
    const candidatura = await prisma.candidatura.create({
      data: {
        projetoId: parseInt(projetoId),
        usuarioId: parseInt(usuarioId),
        status: 'Aceito'
      },
      include: {
        projeto: {
          include: {
            empresa: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Atualiza vagas preenchidas
    await prisma.projetoEmpresa.update({
      where: { id: parseInt(projetoId) },
      data: {
        vagasPreenchidas: { increment: 1 }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Candidatura realizada com sucesso',
      candidatura
    });

  } catch (error) {
    console.error('Erro ao candidatar:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Recusar uma proposta (não se candidatar)
 * POST /api/trilhas/propostas/:propostaId/recusar
 */
export const recusarProposta = async (req: Request, res: Response) => {
  try {
    const { propostaId } = req.params;

    const proposta = await prisma.proposta.update({
      where: { id: parseInt(propostaId) },
      data: {
        estado: 'Recusada'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Proposta recusada',
      proposta
    });

  } catch (error) {
    console.error('Erro ao recusar proposta:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Listar candidaturas do usuário
 * GET /api/trilhas/candidaturas/usuario/:usuarioId
 */
export const listarCandidaturasUsuario = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;

    const candidaturas = await prisma.candidatura.findMany({
      where: {
        usuarioId: parseInt(usuarioId)
      },
      include: {
        projeto: {
          include: {
            empresa: {
              include: {
                user: {
                  select: {
                    name: true,
                    perfilUrl: true
                  }
                }
              }
            },
            habilidadesRequeridas: {
              include: {
                habilidade: true
              }
            }
          }
        },
        avaliacoes: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      candidaturas
    });

  } catch (error) {
    console.error('Erro ao listar candidaturas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// ============================================
// PORTFÓLIO
// ============================================

/**
 * Adicionar item ao portfólio
 * POST /api/trilhas/portfolio
 */
export const adicionarPortfolio = async (req: Request, res: Response) => {
  try {
    const { usuarioId, titulo, descricao, imagemUrl, linkExterno, ordem } = req.body;

    if (!usuarioId || !titulo) {
      return res.status(400).json({
        success: false,
        message: 'usuarioId e titulo são obrigatórios'
      });
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        usuarioId: parseInt(usuarioId),
        titulo,
        descricao,
        imagemUrl,
        linkExterno,
        ordem: ordem || 0
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Item adicionado ao portfólio',
      portfolio
    });

  } catch (error) {
    console.error('Erro ao adicionar portfólio:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Listar portfólio do usuário
 * GET /api/trilhas/portfolio/:usuarioId
 */
export const listarPortfolio = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;

    const portfolios = await prisma.portfolio.findMany({
      where: {
        usuarioId: parseInt(usuarioId)
      },
      orderBy: {
        ordem: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      portfolios
    });

  } catch (error) {
    console.error('Erro ao listar portfólio:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Remover item do portfólio
 * DELETE /api/trilhas/portfolio/:portfolioId
 */
export const removerPortfolio = async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.params;

    await prisma.portfolio.delete({
      where: { id: parseInt(portfolioId) }
    });

    return res.status(200).json({
      success: true,
      message: 'Item removido do portfólio'
    });

  } catch (error) {
    console.error('Erro ao remover portfólio:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// ============================================
// FORMAÇÕES ACADÊMICAS
// ============================================

/**
 * Adicionar formação acadêmica
 * POST /api/trilhas/formacoes
 */
export const adicionarFormacao = async (req: Request, res: Response) => {
  try {
    const { 
      usuarioId, 
      titulo, 
      instituicao, 
      descricao,
      dataInicio,
      dataFim,
      emAndamento
    } = req.body;

    if (!usuarioId || !titulo || !instituicao) {
      return res.status(400).json({
        success: false,
        message: 'usuarioId, titulo e instituicao são obrigatórios'
      });
    }

    const formacao = await prisma.formacao.create({
      data: {
        usuarioId: parseInt(usuarioId),
        titulo,
        instituicao,
        descricao,
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        emAndamento: emAndamento || false
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Formação adicionada com sucesso',
      formacao
    });

  } catch (error) {
    console.error('Erro ao adicionar formação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Listar formações do usuário
 * GET /api/trilhas/formacoes/:usuarioId
 */
export const listarFormacoes = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;

    const formacoes = await prisma.formacao.findMany({
      where: {
        usuarioId: parseInt(usuarioId)
      },
      orderBy: {
        dataInicio: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      formacoes
    });

  } catch (error) {
    console.error('Erro ao listar formações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Remover formação
 * DELETE /api/trilhas/formacoes/:formacaoId
 */
export const removerFormacao = async (req: Request, res: Response) => {
  try {
    const { formacaoId } = req.params;

    await prisma.formacao.delete({
      where: { id: parseInt(formacaoId) }
    });

    return res.status(200).json({
      success: true,
      message: 'Formação removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover formação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// ============================================
// HABILIDADES DO USUÁRIO
// ============================================

/**
 * Adicionar habilidade ao perfil
 * POST /api/trilhas/habilidades
 */
export const adicionarHabilidade = async (req: Request, res: Response) => {
  try {
    const { usuarioId, habilidadeId, nivel } = req.body;

    if (!usuarioId || !habilidadeId) {
      return res.status(400).json({
        success: false,
        message: 'usuarioId e habilidadeId são obrigatórios'
      });
    }

    // Verifica se a habilidade existe
    const habilidade = await prisma.habilidade.findUnique({
      where: { id: parseInt(habilidadeId) }
    });

    if (!habilidade) {
      return res.status(404).json({
        success: false,
        message: 'Habilidade não encontrada'
      });
    }

    // Verifica se já possui esta habilidade
    const habilidadeExistente = await prisma.usuarioHabilidade.findUnique({
      where: {
        usuarioId_habilidadeId: {
          usuarioId: parseInt(usuarioId),
          habilidadeId: parseInt(habilidadeId)
        }
      }
    });

    if (habilidadeExistente) {
      return res.status(400).json({
        success: false,
        message: 'Você já possui esta habilidade'
      });
    }

    const usuarioHabilidade = await prisma.usuarioHabilidade.create({
      data: {
        usuarioId: parseInt(usuarioId),
        habilidadeId: parseInt(habilidadeId),
        nivel: nivel || 1,
        xp: 0
      },
      include: {
        habilidade: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Habilidade adicionada ao perfil',
      habilidade: usuarioHabilidade
    });

  } catch (error) {
    console.error('Erro ao adicionar habilidade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Listar habilidades do usuário
 * GET /api/trilhas/habilidades/:usuarioId
 */
export const listarHabilidadesUsuario = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;

    const habilidades = await prisma.usuarioHabilidade.findMany({
      where: {
        usuarioId: parseInt(usuarioId)
      },
      include: {
        habilidade: true
      },
      orderBy: {
        nivel: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      habilidades
    });

  } catch (error) {
    console.error('Erro ao listar habilidades:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Atualizar nível/XP de habilidade
 * PUT /api/trilhas/habilidades/:usuarioHabilidadeId
 */
export const atualizarHabilidade = async (req: Request, res: Response) => {
  try {
    const { usuarioHabilidadeId } = req.params;
    const { nivel, xp } = req.body;

    const habilidade = await prisma.usuarioHabilidade.update({
      where: { id: parseInt(usuarioHabilidadeId) },
      data: {
        ...(nivel && { nivel: parseInt(nivel) }),
        ...(xp !== undefined && { xp: parseInt(xp) })
      },
      include: {
        habilidade: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Habilidade atualizada',
      habilidade
    });

  } catch (error) {
    console.error('Erro ao atualizar habilidade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Remover habilidade do perfil
 * DELETE /api/trilhas/habilidades/:usuarioHabilidadeId
 */
export const removerHabilidade = async (req: Request, res: Response) => {
  try {
    const { usuarioHabilidadeId } = req.params;

    await prisma.usuarioHabilidade.delete({
      where: { id: parseInt(usuarioHabilidadeId) }
    });

    return res.status(200).json({
      success: true,
      message: 'Habilidade removida do perfil'
    });

  } catch (error) {
    console.error('Erro ao remover habilidade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Listar todas as habilidades disponíveis (catálogo)
 * GET /api/trilhas/habilidades-catalogo
 */
export const listarHabilidadesCatalogo = async (req: Request, res: Response) => {
  try {
    const { categoria } = req.query;

    const habilidades = await prisma.habilidade.findMany({
      where: {
        ...(categoria && { categoria: categoria as string })
      },
      orderBy: {
        nome: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      habilidades
    });

  } catch (error) {
    console.error('Erro ao listar catálogo de habilidades:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// ============================================
// AVALIAÇÕES
// ============================================

/**
 * Empresa avalia usuário após conclusão de projeto
 * POST /api/trilhas/avaliacoes
 */
export const avaliarUsuario = async (req: Request, res: Response) => {
  try {
    const { 
      candidaturaId, 
      empresaId, 
      usuarioId, 
      nota, 
      comentario,
      xpConcedido,
      habilidadeId
    } = req.body;

    if (!candidaturaId || !empresaId || !usuarioId || !nota) {
      return res.status(400).json({
        success: false,
        message: 'candidaturaId, empresaId, usuarioId e nota são obrigatórios'
      });
    }

    const avaliacao = await prisma.avaliacao.create({
      data: {
        candidaturaId: parseInt(candidaturaId),
        empresaId: parseInt(empresaId),
        usuarioId: parseInt(usuarioId),
        nota: parseFloat(nota),
        comentario,
        xpConcedido: xpConcedido || 0,
        habilidadeId: habilidadeId ? parseInt(habilidadeId) : null
      }
    });

    // Se xpConcedido > 0 e habilidadeId fornecido, incrementa XP
    if (xpConcedido && habilidadeId) {
      await prisma.usuarioHabilidade.updateMany({
        where: {
          usuarioId: parseInt(usuarioId),
          habilidadeId: parseInt(habilidadeId)
        },
        data: {
          xp: { increment: parseInt(xpConcedido) }
        }
      });
    }

    // Atualiza status da candidatura
    await prisma.candidatura.update({
      where: { id: parseInt(candidaturaId) },
      data: { status: 'Concluído' }
    });

    return res.status(201).json({
      success: true,
      message: 'Avaliação registrada com sucesso',
      avaliacao
    });

  } catch (error) {
    console.error('Erro ao avaliar usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Listar avaliações recebidas por um usuário
 * GET /api/trilhas/avaliacoes/:usuarioId
 */
export const listarAvaliacoesUsuario = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;

    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        usuarioId: parseInt(usuarioId)
      },
      include: {
        empresa: {
          select: {
            name: true,
            perfilUrl: true
          }
        },
        candidatura: {
          include: {
            projeto: {
              select: {
                nome: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcula média de notas
    const totalNotas = avaliacoes.reduce((sum, av) => sum + av.nota, 0);
    const media = avaliacoes.length > 0 ? totalNotas / avaliacoes.length : 0;

    return res.status(200).json({
      success: true,
      avaliacoes,
      estatisticas: {
        total: avaliacoes.length,
        media: Math.round(media * 10) / 10,
        totalXP: avaliacoes.reduce((sum, av) => sum + av.xpConcedido, 0)
      }
    });

  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

/**
 * Atualizar "Sobre Mim" do perfil
 * PUT /api/trilhas/perfil/:usuarioId/sobre-mim
 */
export const atualizarSobreMim = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;
    const { sobreMim } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(usuarioId) },
      data: {
        sobreMim: sobreMim || null
      },
      select: {
        id: true,
        name: true,
        sobreMim: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Perfil atualizado',
      user
    });

  } catch (error) {
    console.error('Erro ao atualizar sobre mim:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
  
};

  export const buscarPerfilTrilhas = async (req: Request, res: Response) => {
    try {
      const { usuarioId } = req.params;

      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(usuarioId) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          perfilUrl: true,
          sobreMim: true,
          telefone: true,
          createdAt: true,
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
        user
      });
    } catch (error) {
      console.error('Erro ao buscar perfil trilhas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro no servidor'
      });
    }
  };

