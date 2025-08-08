// Script para testar o Schema Prisma do FisioFlow
// Execute: npx ts-node scripts/test-schema.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSchema() {
  try {
    console.log('🚀 Testando Schema do FisioFlow...\n');

    // 1. Testar conexão
    console.log('1️⃣ Testando conexão com Neon...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // 2. Criar usuário admin
    console.log('2️⃣ Criando usuário administrador...');
    const admin = await prisma.user.upsert({
      where: { email: 'admin@fisioflow.com' },
      update: {},
      create: {
        email: 'admin@fisioflow.com',
        password: '$2a$10$example.hash.here', // Em produção, use bcrypt
        name: 'Dr. Administrador',
        role: 'ADMIN',
        crefito: 'CREFITO-123456',
        phone: '(11) 99999-9999'
      }
    });
    console.log(`✅ Admin criado: ${admin.name} (${admin.id})\n`);

    // 3. Criar fisioterapeuta
    console.log('3️⃣ Criando fisioterapeuta...');
    const physio = await prisma.user.upsert({
      where: { email: 'fisio@fisioflow.com' },
      update: {},
      create: {
        email: 'fisio@fisioflow.com',
        password: '$2a$10$example.hash.here',
        name: 'Dra. Fisioterapeuta',
        role: 'FISIOTERAPEUTA',
        crefito: 'CREFITO-789012',
        phone: '(11) 88888-8888'
      }
    });
    console.log(`✅ Fisioterapeuta criado: ${physio.name} (${physio.id})\n`);

    // 4. Criar usuário paciente
    console.log('4️⃣ Criando usuário paciente...');
    const userPatient = await prisma.user.upsert({
      where: { email: 'paciente@email.com' },
      update: {},
      create: {
        email: 'paciente@email.com',
        password: '$2a$10$example.hash.here',
        name: 'João da Silva',
        role: 'PACIENTE',
        phone: '(11) 77777-7777'
      }
    });

    // 5. Criar perfil completo do paciente
    console.log('5️⃣ Criando perfil completo do paciente...');
    const patient = await prisma.patient.upsert({
      where: { userId: userPatient.id },
      update: {},
      create: {
        userId: userPatient.id,
        cpf: '123.456.789-00',
        rg: '12.345.678-9',
        birthDate: new Date('1990-05-15'),
        phone: '(11) 77777-7777',
        email: 'paciente@email.com',
        emergencyContact: 'Maria Silva - (11) 66666-6666',
        address: {
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 45',
          district: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        },
        healthInsurance: {
          name: 'SulAmérica',
          cardNumber: '123456789012345',
          expiryDate: '2025-12-31',
          type: 'Particular'
        },
        medicalHistory: {
          previousSurgeries: [],
          chronicDiseases: ['Hipertensão'],
          familyHistory: 'Diabetes (mãe)',
          notes: 'Paciente ativo, pratica exercícios regularmente'
        },
        currentMedications: 'Losartana 50mg - 1x ao dia',
        allergies: 'Nenhuma alergia conhecida',
        profession: 'Engenheiro',
        workplace: 'Empresa XYZ Ltda'
      }
    });
    console.log(`✅ Paciente criado: ${userPatient.name} (CPF: ${patient.cpf})\n`);

    // 6. Criar agendamento
    console.log('6️⃣ Criando agendamento...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        physiotherapistId: physio.id,
        dateTime: tomorrow,
        duration: 60,
        type: 'AVALIACAO',
        status: 'AGENDADO',
        value: 120.00,
        paymentMethod: 'CARTAO',
        notes: 'Primeira consulta - Avaliação completa'
      }
    });
    console.log(`✅ Agendamento criado para ${tomorrow.toLocaleDateString('pt-BR')} às ${tomorrow.toLocaleTimeString('pt-BR')}\n`);

    // 7. Criar ponto de dor no mapa corporal
    console.log('7️⃣ Criando ponto no mapa corporal...');
    const painPoint = await prisma.bodyMap.create({
      data: {
        patientId: patient.id,
        x: 65.5, // Coordenada X em %
        y: 35.8, // Coordenada Y em %
        intensity: 7,
        painType: 'DOR',
        side: 'FRONT',
        bodyPart: 'shoulder_right',
        description: 'Dor no ombro direito',
        notes: 'Dor que piora com movimentos acima da cabeça. Início há 2 semanas após atividade física intensa.'
      }
    });
    console.log(`✅ Ponto de dor registrado: Intensidade ${painPoint.intensity}/10 no ${painPoint.bodyPart}\n`);

    // 8. Criar exercício
    console.log('8️⃣ Criando exercício na biblioteca...');
    const exercise = await prisma.exercise.create({
      data: {
        name: 'Pendulo de Codman',
        category: 'MEMBROS_SUPERIORES',
        description: 'Exercício de mobilização passiva para o ombro',
        instructions: '1. Apoie-se com uma mão em uma mesa\n2. Deixe o braço lesionado balançar livremente\n3. Faça movimentos circulares suaves\n4. Não force o movimento',
        defaultSets: 2,
        defaultReps: '10 circulos cada direção',
        defaultRest: 30,
        indications: ['Bursite', 'Tendinite', 'Pós-cirúrgico ombro'],
        contraindications: ['Luxação aguda', 'Fratura não consolidada'],
        equipment: ['Mesa ou cadeira para apoio'],
        difficulty: 1
      }
    });
    console.log(`✅ Exercício criado: ${exercise.name} (${exercise.category})\n`);

    // 9. Criar prescrição com exercício
    console.log('9️⃣ Criando prescrição de exercícios...');
    const prescription = await prisma.prescription.create({
      data: {
        patientId: patient.id,
        physiotherapistId: physio.id,
        title: 'Protocolo Ombro - Fase Inicial',
        description: 'Exercícios para mobilização e alívio da dor',
        startDate: new Date(),
        frequency: '2x ao dia (manhã e noite)',
        generalNotes: 'Executar sem dor. Parar se houver aumento dos sintomas.',
        exercises: {
          create: {
            exerciseId: exercise.id,
            sets: 2,
            reps: '10 círculos cada direção',
            rest: 30,
            specificNotes: 'Movimento bem suave, sem forçar amplitude',
            order: 1
          }
        }
      },
      include: {
        exercises: {
          include: {
            exercise: true
          }
        }
      }
    });
    console.log(`✅ Prescrição criada: ${prescription.title} com ${prescription.exercises.length} exercício(s)\n`);

    // 10. Criar prontuário
    console.log('🔟 Criando prontuário clínico...');
    const clinicalRecord = await prisma.clinicalRecord.create({
      data: {
        patientId: patient.id,
        physiotherapistId: physio.id,
        initialAssessment: {
          chiefComplaint: 'Dor no ombro direito há 2 semanas',
          painScale: 7,
          functionalLimitation: 'Dificuldade para pentear cabelo e alcançar objetos altos',
          previousTreatments: 'Uso de anti-inflamatório por 3 dias',
          onsetDate: '2024-01-15',
          mechanism: 'Exercício físico intenso'
        },
        diagnosis: 'Tendinopatia do manguito rotador à direita',
        objectives: [
          'Reduzir dor de 7/10 para 3/10 em 2 semanas',
          'Recuperar amplitude de movimento completa em 4 semanas', 
          'Retornar às atividades de vida diária sem limitação em 6 semanas'
        ],
        treatmentPlan: {
          phase1: {
            duration: '2 semanas',
            focus: 'Controle da dor e inflamação',
            interventions: ['Mobilização passiva', 'Crioterapia', 'Exercícios pendulares']
          },
          phase2: {
            duration: '2-4 semanas',
            focus: 'Recuperação da amplitude de movimento',
            interventions: ['Mobilização ativa-assistida', 'Alongamentos']
          },
          phase3: {
            duration: '4-6 semanas',
            focus: 'Fortalecimento e funcionalidade',
            interventions: ['Exercícios resistidos', 'Atividades funcionais']
          }
        },
        evolution: [],
        tests: {
          rom: {
            flexion: '120°',
            abduction: '90°',
            externalRotation: '30°'
          },
          specialTests: {
            neer: 'Positivo',
            hawkins: 'Positivo',
            jobe: 'Negativo'
          }
        }
      }
    });
    console.log(`✅ Prontuário criado com diagnóstico: ${clinicalRecord.diagnosis}\n`);

    // 11. Estatísticas finais
    console.log('📊 Estatísticas do banco:');
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.bodyMap.count(),
      prisma.exercise.count(),
      prisma.prescription.count(),
      prisma.clinicalRecord.count()
    ]);

    console.log(`👥 Usuários: ${stats[0]}`);
    console.log(`🏥 Pacientes: ${stats[1]}`);
    console.log(`📅 Agendamentos: ${stats[2]}`);
    console.log(`🗺️ Pontos no mapa corporal: ${stats[3]}`);
    console.log(`🏋️ Exercícios: ${stats[4]}`);
    console.log(`📋 Prescrições: ${stats[5]}`);
    console.log(`📝 Prontuários: ${stats[6]}`);

    console.log('\n🎉 Schema testado com sucesso! Todos os modelos estão funcionando corretamente.');
    console.log('🚀 Pronto para começar o desenvolvimento do FisioFlow!');

  } catch (error) {
    console.error('❌ Erro ao testar schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste automaticamente
testSchema();