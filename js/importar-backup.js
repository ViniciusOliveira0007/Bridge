"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
function importarBackup() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            console.log('🔄 Iniciando importação do backup...\n');
            // Ler o arquivo de backup
            const backupPath = path.join(__dirname, 'backup-bridge.json');
            const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
            console.log('📊 Dados encontrados no backup:');
            console.log(`   - ${((_a = backupData.atividades) === null || _a === void 0 ? void 0 : _a.length) || 0} atividades`);
            console.log(`   - ${((_b = backupData.postagens) === null || _b === void 0 ? void 0 : _b.length) || 0} postagens`);
            console.log(`   - ${((_c = backupData.arquivos) === null || _c === void 0 ? void 0 : _c.length) || 0} arquivos`);
            console.log(`   - ${((_d = backupData.membros) === null || _d === void 0 ? void 0 : _d.length) || 0} membros\n`);
            // ===== CRIAR/VERIFICAR ESTRUTURA BÁSICA =====
            // 1. Curso
            let curso = yield prisma.curso.findFirst();
            if (!curso) {
                curso = yield prisma.curso.create({
                    data: {
                        nome: 'Análise e Desenvolvimento de Sistemas',
                        sigla: 'ADS'
                    }
                });
                console.log('✅ Curso criado:', curso.nome);
            }
            // 2. Professor Vinicius
            let professor = yield prisma.user.upsert({
                where: { email: 'vini@etec.sp.gov.br' },
                update: { role: 'professor' },
                create: {
                    email: 'vini@etec.sp.gov.br',
                    name: 'Vinicius',
                    senha: '123456',
                    role: 'professor'
                }
            });
            console.log('✅ Professor:', professor.name);
            // 3. Aluno Rodrigo Santos
            let rodrigo = yield prisma.user.upsert({
                where: { email: 'rodrigo@etec.sp.gov.br' },
                update: {},
                create: {
                    email: 'rodrigo@etec.sp.gov.br',
                    name: 'Rodrigo Santos',
                    senha: '123456',
                    role: 'aluno'
                }
            });
            console.log('✅ Aluno:', rodrigo.name);
            // 4. Turma
            let turma = yield prisma.turma.findFirst();
            if (!turma) {
                turma = yield prisma.turma.create({
                    data: {
                        nome: 'Sistemas Embarcados - 3º Semestre',
                        descricao: 'Turma de Sistemas Embarcados',
                        cursoId: curso.id,
                        professorId: professor.id
                    }
                });
                console.log('✅ Turma criada:', turma.nome);
            }
            // 5. Adicionar Rodrigo à turma
            yield prisma.turmaAluno.upsert({
                where: {
                    turmaId_alunoId: {
                        turmaId: turma.id,
                        alunoId: rodrigo.id
                    }
                },
                update: {},
                create: {
                    turmaId: turma.id,
                    alunoId: rodrigo.id
                }
            });
            console.log('✅ Rodrigo adicionado à turma\n');
            // ===== IMPORTAR ATIVIDADES =====
            console.log('📥 Importando atividades...');
            let atividadesImportadas = 0;
            for (const ativ of backupData.atividades || []) {
                try {
                    const existe = yield prisma.atividade.findFirst({
                        where: {
                            titulo: ativ.titulo,
                            turmaId: turma.id
                        }
                    });
                    if (!existe) {
                        const atividadeCriada = yield prisma.atividade.create({
                            data: {
                                titulo: ativ.titulo,
                                descricao: ativ.descricao || '',
                                dataEntrega: new Date(ativ.prazo),
                                turmaId: turma.id,
                                professorId: professor.id
                            }
                        });
                        // Importar entregas
                        if (ativ.entregas && ativ.entregas.length > 0) {
                            for (const entrega of ativ.entregas) {
                                // Encontrar o aluno (Vinicius = 1, Rodrigo = 2)
                                const alunoId = entrega.alunoId === "1" ? professor.id : rodrigo.id;
                                try {
                                    yield prisma.entrega.create({
                                        data: {
                                            atividadeId: atividadeCriada.id,
                                            alunoId: alunoId,
                                            comentario: entrega.comentario || '',
                                            dataEntrega: new Date(entrega.data),
                                            nota: entrega.nota || null
                                        }
                                    });
                                }
                                catch (e) {
                                    // Ignora se já existe
                                }
                            }
                        }
                        atividadesImportadas++;
                        console.log(`   ✅ ${ativ.titulo} (${((_e = ativ.entregas) === null || _e === void 0 ? void 0 : _e.length) || 0} entregas)`);
                    }
                    else {
                        console.log(`   ⏭️ Já existe: ${ativ.titulo}`);
                    }
                }
                catch (error) {
                    console.log(`   ❌ Erro ao importar "${ativ.titulo}":`, error.message);
                }
            }
            console.log(`\n🎉 Importação concluída!`);
            console.log(`   ✅ ${atividadesImportadas} atividades importadas`);
            console.log(`\n💡 Próximos passos:`);
            console.log(`   1. Abrir Prisma Studio: npx prisma studio`);
            console.log(`   2. Recarregar a página do sistema`);
            console.log(`   3. Fazer login como: vini@etec.sp.gov.br / 123456\n`);
        }
        catch (error) {
            console.error('❌ Erro na importação:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
importarBackup();
