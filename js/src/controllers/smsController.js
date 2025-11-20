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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reenviarCodigoSMS = exports.verificarCodigoSMS = exports.enviarCodigoSMS = void 0;
const client_1 = require("@prisma/client");
const twilio_1 = __importDefault(require("twilio"));
const prisma = new client_1.PrismaClient();
// Configuração do Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
// Inicializa cliente Twilio apenas se as credenciais existirem E forem válidas
let client = null;
// ✅ CORREÇÃO: Valida se as credenciais existem e são válidas antes de inicializar
if (accountSid && authToken && accountSid.startsWith('AC') && authToken.length > 20) {
    try {
        client = (0, twilio_1.default)(accountSid, authToken);
        console.log('✅ Cliente Twilio inicializado com sucesso');
    }
    catch (error) {
        console.error('❌ Erro ao inicializar Twilio:', error);
        console.warn('⚠️ SMS não estará disponível');
    }
}
else {
    console.warn('⚠️ Credenciais Twilio não configuradas ou inválidas');
    console.warn('💡 Para testar sem SMS real, os códigos aparecerão no console do servidor');
}
/**
 * Gera código de 6 dígitos
 */
function gerarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * Formata telefone brasileiro para E.164
 * Exemplo: (11) 99999-9999 → +5511999999999
 */
function formatarTelefone(telefone) {
    // Remove tudo que não é número
    const numeros = telefone.replace(/\D/g, '');
    // Se já começa com código do país, retorna
    if (numeros.startsWith('55') && numeros.length === 13) {
        return `+${numeros}`;
    }
    // Se tem 11 dígitos (DDD + 9 dígitos), adiciona +55
    if (numeros.length === 11) {
        return `+55${numeros}`;
    }
    // Se tem 10 dígitos (DDD + 8 dígitos), adiciona +55
    if (numeros.length === 10) {
        return `+55${numeros}`;
    }
    // Retorna como estava se não encaixar nos padrões
    return telefone;
}
/**
 * Enviar código SMS após login bem-sucedido
 * POST /api/enviar-codigo-sms
 */
const enviarCodigoSMS = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, telefone } = req.body;
        console.log('📱 Requisição de envio SMS:', { userId, telefone });
        // Validações
        if (!userId || !telefone) {
            return res.status(400).json({
                success: false,
                message: 'userId e telefone são obrigatórios'
            });
        }
        // Verifica se usuário existe
        const user = yield prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        // Gera código
        const codigo = gerarCodigo();
        const expiraEm = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
        console.log('🔢 Código gerado:', codigo);
        console.log('⏰ Expira em:', expiraEm.toLocaleString('pt-BR'));
        // Salva no banco
        yield prisma.codigoVerificacao.create({
            data: {
                telefone,
                codigo,
                expiraEm,
                userId: parseInt(userId)
            }
        });
        console.log('💾 Código salvo no banco de dados');
        // Formata telefone
        const telefoneFormatado = formatarTelefone(telefone);
        console.log('📞 Telefone formatado:', telefoneFormatado);
        // ✅ CORREÇÃO: Se NÃO tiver Twilio configurado, apenas retorna sucesso (modo desenvolvimento)
        if (!client) {
            console.log('');
            console.log('═══════════════════════════════════════════');
            console.log('🔐 CÓDIGO DE VERIFICAÇÃO (MODO DESENVOLVIMENTO)');
            console.log('═══════════════════════════════════════════');
            console.log(`   Usuário: ${user.name} (ID: ${userId})`);
            console.log(`   Telefone: ${telefone}`);
            console.log(`   CÓDIGO: ${codigo}`);
            console.log(`   Válido até: ${expiraEm.toLocaleString('pt-BR')}`);
            console.log('═══════════════════════════════════════════');
            console.log('');
            return res.status(200).json({
                success: true,
                message: 'Código gerado com sucesso (desenvolvimento)',
                // ⚠️ APENAS EM DESENVOLVIMENTO - REMOVA EM PRODUÇÃO
                debug: {
                    codigo: codigo,
                    nota: 'Twilio não configurado - código aparece no console'
                }
            });
        }
        // Envia SMS via Twilio (apenas se configurado)
        try {
            const message = yield client.messages.create({
                body: `Bridge - Seu código de verificação é: ${codigo}. Válido por 5 minutos.`,
                from: twilioPhone,
                to: telefoneFormatado
            });
            console.log('✅ SMS enviado com sucesso via Twilio');
            console.log('📨 Message SID:', message.sid);
            return res.status(200).json({
                success: true,
                message: 'Código enviado por SMS'
            });
        }
        catch (twilioError) {
            console.error('❌ Erro ao enviar SMS via Twilio:', twilioError.message);
            // Mesmo com erro do Twilio, o código foi salvo no banco
            // Então retorna sucesso para continuar o fluxo
            return res.status(200).json({
                success: true,
                message: 'Código gerado (erro ao enviar SMS)',
                debug: {
                    codigo: codigo,
                    erro: 'Falha no envio do SMS, mas código foi salvo'
                }
            });
        }
    }
    catch (error) {
        console.error('❌ Erro geral ao processar SMS:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao processar envio de SMS',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
exports.enviarCodigoSMS = enviarCodigoSMS;
/**
 * Verificar código SMS
 * POST /api/verificar-codigo-sms
 */
const verificarCodigoSMS = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { telefone, codigo, userId } = req.body;
        console.log('🔍 Verificando código SMS:', { telefone, codigo: '******', userId });
        // Validações
        if (!telefone || !codigo) {
            return res.status(400).json({
                success: false,
                message: 'Telefone e código são obrigatórios'
            });
        }
        // Busca código válido
        const verificacao = yield prisma.codigoVerificacao.findFirst({
            where: Object.assign({ telefone,
                codigo, expiraEm: { gte: new Date() }, usado: false }, (userId && { userId: parseInt(userId) }))
        });
        if (!verificacao) {
            console.log('❌ Código inválido ou expirado');
            // Debug: Mostra códigos válidos no console (apenas desenvolvimento)
            const codigosValidos = yield prisma.codigoVerificacao.findMany({
                where: {
                    telefone,
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
        yield prisma.codigoVerificacao.update({
            where: { id: verificacao.id },
            data: { usado: true }
        });
        console.log(`✅ Código verificado com sucesso para telefone ${telefone}`);
        return res.status(200).json({
            success: true,
            message: 'Código verificado com sucesso',
            verified: true
        });
    }
    catch (error) {
        console.error('❌ Erro ao verificar código:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao verificar código',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
exports.verificarCodigoSMS = verificarCodigoSMS;
/**
 * (OPCIONAL) Reenviar código SMS
 * POST /api/reenviar-codigo-sms
 */
const reenviarCodigoSMS = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, telefone } = req.body;
        console.log('♻️ Reenviando código SMS');
        // Invalida códigos anteriores não usados
        yield prisma.codigoVerificacao.updateMany({
            where: {
                telefone,
                usado: false
            },
            data: {
                usado: true
            }
        });
        console.log('✅ Códigos anteriores invalidados');
        // Usa a mesma lógica de enviar código
        return (0, exports.enviarCodigoSMS)(req, res);
    }
    catch (error) {
        console.error('❌ Erro ao reenviar código:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao reenviar código'
        });
    }
});
exports.reenviarCodigoSMS = reenviarCodigoSMS;
