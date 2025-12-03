import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

const prisma = new PrismaClient();

// Configuração do Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client: ReturnType<typeof twilio> | null = null;

if (accountSid && authToken && accountSid.startsWith('AC') && authToken.length > 20) {
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Cliente Twilio inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Twilio:', error);
    console.warn('⚠️ SMS não estará disponível');
  }
} else {
  console.warn('⚠️ Credenciais Twilio não configuradas ou inválidas');
  console.warn('💡 Para testar sem SMS real, os códigos aparecerão no console do servidor');
}

function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');
  
  if (numeros.startsWith('55') && numeros.length === 13) {
    return `+${numeros}`;
  }
  
  if (numeros.length === 11 || numeros.length === 10) {
    return `+55${numeros}`;
  }
  
  return telefone;
}

/**
 * ✅ CORRIGIDO: Aceita userId OU email para buscar telefone
 * POST /api/enviar-codigo-sms
 */
export const enviarCodigoSMS = async (req: Request, res: Response) => {
  try {
    const { userId, email, telefone } = req.body;

    console.log('📱 Requisição de envio SMS:', { userId, email, telefone: telefone ? '***' : 'não fornecido' });

    // ✅ Busca usuário por userId OU email
    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email }
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // ✅ Usa telefone do body OU do usuário no banco
    const telefoneUsuario = telefone || user.telefone;

    if (!telefoneUsuario) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não possui telefone cadastrado'
      });
    }

    // Gera código
    const codigo = gerarCodigo();
    const expiraEm = new Date(Date.now() + 5 * 60 * 1000);

    console.log('🔢 Código gerado:', codigo);
    console.log('⏰ Expira em:', expiraEm.toLocaleString('pt-BR'));

    // Salva no banco
    await prisma.codigoVerificacao.create({
      data: {
        telefone: telefoneUsuario,
        codigo,
        expiraEm,
        userId: user.id
      }
    });

    console.log('💾 Código salvo no banco de dados');

    const telefoneFormatado = formatarTelefone(telefoneUsuario);
    console.log('📞 Telefone formatado:', telefoneFormatado);

    // Modo desenvolvimento sem Twilio
    if (!client) {
      console.log('');
      console.log('╔═══════════════════════════════════════════╗');
      console.log('📋 CÓDIGO DE VERIFICAÇÃO (MODO DESENVOLVIMENTO)');
      console.log('╠═══════════════════════════════════════════╣');
      console.log(`   Usuário: ${user.name} (ID: ${user.id})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Telefone: ${telefoneUsuario}`);
      console.log(`   CÓDIGO: ${codigo}`);
      console.log(`   Válido até: ${expiraEm.toLocaleString('pt-BR')}`);
      console.log('╚═══════════════════════════════════════════╝');
      console.log('');

      return res.status(200).json({
        success: true,
        message: 'Código gerado com sucesso (desenvolvimento)',
        telefone: telefoneUsuario,
        debug: {
          codigo: codigo,
          nota: 'Twilio não configurado - código aparece no console'
        }
      });
    }

    // Envia SMS via Twilio
    try {
      const message = await client.messages.create({
        body: `Bridge - Seu código de verificação é: ${codigo}. Válido por 5 minutos.`,
        from: twilioPhone,
        to: telefoneFormatado
      });

      console.log('✅ SMS enviado com sucesso via Twilio');
      console.log('📨 Message SID:', message.sid);

      return res.status(200).json({
        success: true,
        message: 'Código enviado por SMS',
        telefone: telefoneUsuario
      });

    } catch (twilioError: any) {
      console.error('❌ Erro ao enviar SMS via Twilio:', twilioError.message);
      
      return res.status(200).json({
        success: true,
        message: 'Código gerado (erro ao enviar SMS)',
        telefone: telefoneUsuario,
        debug: {
          codigo: codigo,
          erro: 'Falha no envio do SMS, mas código foi salvo'
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro geral ao processar SMS:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar envio de SMS',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * Verificar código SMS
 * POST /api/verificar-codigo-sms
 */
export const verificarCodigoSMS = async (req: Request, res: Response) => {
  try {
    const { telefone, codigo, userId, email } = req.body;

    console.log('🔍 Verificando código SMS:', { telefone, codigo: '******', userId, email });

    if (!codigo) {
      return res.status(400).json({
        success: false,
        message: 'Código é obrigatório'
      });
    }

    // Busca usuário se fornecido userId ou email
    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    // Usa telefone do body OU do usuário
    const telefoneVerificar = telefone || user?.telefone;

    if (!telefoneVerificar) {
      return res.status(400).json({
        success: false,
        message: 'Telefone não identificado'
      });
    }

    // Busca código válido
    const verificacao = await prisma.codigoVerificacao.findFirst({
      where: {
        telefone: telefoneVerificar,
        codigo,
        expiraEm: { gte: new Date() },
        usado: false,
        ...(user && { userId: user.id })
      }
    });

    if (!verificacao) {
      console.log('❌ Código inválido ou expirado');
      
      // Debug: Mostra códigos válidos no console (apenas desenvolvimento)
      const codigosValidos = await prisma.codigoVerificacao.findMany({
        where: {
          telefone: telefoneVerificar,
          usado: false
        },
        orderBy: {
          criadoEm: 'desc'
        },
        take: 3
      });

      if (codigosValidos.length > 0) {
        console.log('📋 Códigos encontrados para este telefone:');
        codigosValidos.forEach(c => {
          const expirado = c.expiraEm < new Date();
          console.log(`   - ${c.codigo} (${expirado ? 'EXPIRADO' : 'válido'}) - Criado: ${c.criadoEm.toLocaleString('pt-BR')}`);
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Código inválido ou expirado'
      });
    }

    // Marca como usado
    await prisma.codigoVerificacao.update({
      where: { id: verificacao.id },
      data: { usado: true }
    });

    console.log(`✅ Código verificado com sucesso para telefone ${telefoneVerificar}`);

    return res.status(200).json({
      success: true,
      message: 'Código verificado com sucesso',
      verified: true
    });

  } catch (error) {
    console.error('❌ Erro ao verificar código:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar código',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * (OPCIONAL) Reenviar código SMS
 * POST /api/reenviar-codigo-sms
 */
export const reenviarCodigoSMS = async (req: Request, res: Response) => {
  try {
    const { userId, telefone, email } = req.body;

    console.log('♻️ Reenviando código SMS');

    // Busca usuário
    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    const telefoneUsuario = telefone || user?.telefone;

    if (!telefoneUsuario) {
      return res.status(400).json({
        success: false,
        message: 'Telefone não encontrado'
      });
    }

    // Invalida códigos anteriores não usados
    await prisma.codigoVerificacao.updateMany({
      where: {
        telefone: telefoneUsuario,
        usado: false
      },
      data: {
        usado: true
      }
    });

    console.log('✅ Códigos anteriores invalidados');

    // Usa a mesma lógica de enviar código
    return enviarCodigoSMS(req, res);

  } catch (error) {
    console.error('❌ Erro ao reenviar código:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao reenviar código'
    });
  }
};