# 🗄️ Setup do Database - FisioFlow

## Configuração do Schema Prisma Completo

O schema foi otimizado para **Neon PostgreSQL** com todas as funcionalidades necessárias para uma clínica de fisioterapia moderna.

## 📋 Modelos Implementados

### 🔐 **USER** - Sistema Multi-Role
- **ADMIN**: Proprietário da clínica (você)
- **FISIOTERAPEUTA**: Profissionais da clínica  
- **ESTAGIARIO**: Estudantes/estagiários
- **PACIENTE**: Pacientes da clínica
- **PARCEIRO**: Educadores físicos parceiros

### 👥 **PATIENT** - Dados Completos do Paciente
- Documentos (CPF, RG)
- Contatos completos + emergência
- Endereço estruturado (JSON)
- Plano de saúde (JSON)
- Histórico médico (JSON)
- Medicamentos e alergias

### 📅 **APPOINTMENT** - Agendamentos
- Status: AGENDADO, CONFIRMADO, ATENDIDO, FALTOU
- Tipos: AVALIACAO, SESSAO, RETORNO, REAVALIACAO
- Informações financeiras integradas
- Soft delete para histórico

### 🏥 **CLINICAL_RECORD** - Prontuário Eletrônico
- Avaliação inicial estruturada (JSON)
- Diagnóstico fisioterapêutico
- Objetivos do tratamento
- Evolução histórica (Array JSON)
- Testes e medidas

### 🗺️ **BODY_MAP** - Mapa Corporal (Diferencial)
- Coordenadas X,Y em porcentagem (0-100)
- Intensidade de dor (0-10)
- Tipos: DOR, DESCONFORTO, RIGIDEZ, etc.
- Timeline de evolução
- Anotações específicas

### 🏋️ **EXERCISE** - Biblioteca de Exercícios
- Categorias especializadas
- Vídeos e imagens demonstrativas
- Parâmetros padrão (séries, repetições)
- Indicações e contraindicações
- Equipamentos necessários

### 📋 **PRESCRIPTION** - Prescrições de Exercícios
- Prescrições personalizadas
- Relacionamento many-to-many com exercícios
- Parâmetros específicos por exercício
- Status de progresso

### 🤝 **PARTNER** - Sistema de Parcerias
- Educadores físicos parceiros
- Registro CREF
- Comissionamento
- Pacientes compartilhados

## 🚀 Comandos de Setup

### 1. **Instalar Dependências**
```bash
npm install prisma @prisma/client
npm install @types/node typescript ts-node
```

### 2. **Configurar Variáveis de Ambiente**
```bash
# Copiar exemplo
cp .env.example .env

# Editar com seus dados Neon
nano .env
```

### 3. **Gerar e Aplicar Schema**
```bash
# Gerar Prisma Client
npx prisma generate

# Aplicar schema no Neon (primeira vez)
npx prisma db push

# Ou criar migration (recomendado para produção)
npx prisma migrate dev --name init
```

### 4. **Visualizar Database**
```bash
# Abrir Prisma Studio
npx prisma studio
```

## 🎯 Otimizações para Neon

### **Tipos PostgreSQL Nativos**
- `@db.Uuid` para IDs (melhor performance)
- `@db.Timestamptz` para timestamps
- `@db.Date` para datas
- `@db.Decimal(10,2)` para valores monetários
- `Json` para dados estruturados

### **Índices Estratégicos**
- `@@index([email])` - Login rápido
- `@@index([cpf])` - Busca por documento
- `@@index([dateTime])` - Consultas por data
- `@@index([patientId])` - Relacionamentos
- `@@index([isActive])` - Soft delete

### **Relacionamentos Otimizados**
- `onDelete: Cascade` para limpeza automática
- `@unique` constraints para integridade
- Named relations para clareza
- Índices em foreign keys

## 📊 Exemplos de Uso

### **Criar Usuário Administrador**
```typescript
const admin = await prisma.user.create({
  data: {
    email: "admin@clinica.com",
    password: hashedPassword,
    name: "Dr. João Silva",
    role: "ADMIN",
    crefito: "CREFITO-123456"
  }
});
```

### **Registrar Ponto de Dor no Mapa Corporal**
```typescript
const painPoint = await prisma.bodyMap.create({
  data: {
    patientId: "uuid-do-paciente",
    x: 45.5, // % da coordenada X
    y: 67.8, // % da coordenada Y  
    intensity: 8,
    painType: "DOR",
    side: "FRONT",
    bodyPart: "shoulder",
    description: "Dor intensa no ombro direito",
    notes: "Piora com movimentos acima da cabeça"
  }
});
```

### **Criar Prescrição de Exercícios**
```typescript
const prescription = await prisma.prescription.create({
  data: {
    patientId: "uuid-do-paciente",
    physiotherapistId: "uuid-do-fisio",
    title: "Protocolo Ombro - Fase 1",
    frequency: "3x por semana",
    startDate: new Date(),
    exercises: {
      create: [
        {
          exerciseId: "uuid-do-exercicio",
          sets: 3,
          reps: "15-20",
          rest: 60,
          specificNotes: "Executar com amplitude livre de dor"
        }
      ]
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
```

## 🔍 Queries Úteis

### **Dashboard - Estatísticas**
```typescript
// Pacientes ativos
const activePatients = await prisma.patient.count({
  where: { isActive: true }
});

// Consultas hoje
const todayAppointments = await prisma.appointment.count({
  where: {
    dateTime: {
      gte: startOfDay(new Date()),
      lt: endOfDay(new Date())
    },
    status: { not: "CANCELADO" }
  }
});

// Receita mensal
const monthlyRevenue = await prisma.appointment.aggregate({
  where: {
    dateTime: {
      gte: startOfMonth(new Date()),
      lt: endOfMonth(new Date())
    },
    isPaid: true
  },
  _sum: { value: true }
});
```

### **Evolução do Paciente**
```typescript
const painEvolution = await prisma.bodyMap.findMany({
  where: { patientId: "uuid-do-paciente" },
  orderBy: { recordedAt: "asc" },
  select: {
    recordedAt: true,
    intensity: true,
    bodyPart: true,
    painType: true
  }
});
```

## 🛡️ Segurança

### **Soft Delete Implementado**
- Registros nunca são deletados fisicamente
- Campo `deletedAt` para exclusão lógica
- Campo `isActive` para filtros rápidos

### **Auditoria Completa**
- `createdAt` - Timestamp de criação
- `updatedAt` - Timestamp de modificação
- Rastreamento de modificações

### **Validações no Schema**
- Campos obrigatórios bem definidos
- Constraints de unicidade
- Relacionamentos com integridade referencial

## 🚨 Troubleshooting

### **Error: relation does not exist**
```bash
# Aplicar schema novamente
npx prisma db push --force-reset
```

### **Error: Invalid connection string**
```bash
# Verificar formato Neon
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

### **Performance lenta**
```bash
# Verificar índices
npx prisma studio
# Analisar queries no dashboard Neon
```

## ✅ Checklist de Validação

- [ ] Schema aplicado sem erros
- [ ] Prisma Studio abrindo corretamente  
- [ ] Criação de usuário funcionando
- [ ] Relacionamentos corretos
- [ ] Índices criados
- [ ] Soft delete funcionando
- [ ] Tipos PostgreSQL corretos

O schema está pronto para desenvolvimento! 🚀