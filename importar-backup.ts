import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importarBackup() {
    try {
        console.log('🔄 Iniciando importação do backup...\n');
        
        // Ler o arquivo de backup
        const backupPath = path.join(__dirname, 'backup-bridge.json');
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
        
        console.log('📊 Dados encontrados no backup:');
        console.log(`   - ${backupData.atividades?.length || 0} atividades`);
        console.log(`   - ${backupData.postagens?.length || 0} postagens`);
        console.log(`   - ${backupData.arquivos?.length || 0} arquivos`);
        console.log(`   - ${backupData.membros?.length || 0} membros\n`);
        
        // ===== CRIAR/VERIFICAR ESTRUTURA BÁSICA =====
        
        // 1. Curso
        let curso = await prisma.curso.findFirst();
        if (!curso) {
            curso = await prisma.curso.create({
                data: {
                    nome: 'Análise e Desenvolvimento de Sistemas',
                    sigla: 'ADS'
                }
            });
            console.log('✅ Curso criado:', curso.nome);
        }
        
        // 2. Professor Vinicius
        let professor = await prisma.user.upsert({
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
        let rodrigo = await prisma.user.upsert({
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
        let turma = await prisma.turma.findFirst();
        if (!turma) {
            turma = await prisma.turma.create({
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
        await prisma.turmaAluno.upsert({
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
                const existe = await prisma.atividade.findFirst({
                    where: {
                        titulo: ativ.titulo,
                        turmaId: turma.id
                    }
                });
                
                if (!existe) {
                    const atividadeCriada = await prisma.atividade.create({
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
                                await prisma.entrega.create({
                                    data: {
                                        atividadeId: atividadeCriada.id,
                                        alunoId: alunoId,
                                        comentario: entrega.comentario || '',
                                        dataEntrega: new Date(entrega.data),
                                        nota: entrega.nota || null
                                    }
                                });
                            } catch (e) {
                                // Ignora se já existe
                            }
                        }
                    }
                    
                    atividadesImportadas++;
                    console.log(`   ✅ ${ativ.titulo} (${ativ.entregas?.length || 0} entregas)`);
                } else {
                    console.log(`   ⏭️ Já existe: ${ativ.titulo}`);
                }
            } catch (error: any) {
                console.log(`   ❌ Erro ao importar "${ativ.titulo}":`, error.message);
            }
        }
        
        console.log(`\n🎉 Importação concluída!`);
        console.log(`   ✅ ${atividadesImportadas} atividades importadas`);
        console.log(`\n💡 Próximos passos:`);
        console.log(`   1. Abrir Prisma Studio: npx prisma studio`);
        console.log(`   2. Recarregar a página do sistema`);
        console.log(`   3. Fazer login como: vini@etec.sp.gov.br / 123456\n`);
        
    } catch (error) {
        console.error('❌ Erro na importação:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importarBackup();