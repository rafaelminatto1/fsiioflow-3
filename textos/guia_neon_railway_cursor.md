# GUIA COMPLETO: NEON + RAILWAY + CURSOR IDE

## 🎯 SEQUÊNCIA COMPLETA DE IMPLEMENTAÇÃO

### **FASE 1: CONFIGURAR INFRAESTRUTURA (30 MINUTOS)**
### **FASE 2: CONFIGURAR CURSOR IDE (15 MINUTOS)**
### **FASE 3: PROMPTS PARA ESTRUTURAR PROJETO (60 MINUTOS)**

---

## 🚀 FASE 1: CONFIGURAR NEON + RAILWAY

### **PASSO 1: CRIAR CONTA NEON (10 MINUTOS)**

#### **1.1 Acessar e Criar Conta**
```
1. Acesse: https://neon.tech/
2. Clique em "Sign up"
3. Escolha "Continue with Google"
4. Use seu email principal
5. Confirme email se necessário
```

#### **1.2 Criar Database**
```
1. No dashboard, clique "Create a database"
2. Preencha:
   - Database name: fisioflow
   - Region: US East (Ohio) - us-east-2
   - PostgreSQL version: 15 (padrão)
3. Clique "Create database"
4. Aguarde criação (1-2 minutos)
```

#### **1.3 Configurar Plano Scale**
```
1. Vá em "Settings" → "Billing"
2. Clique "Upgrade to Scale"
3. Adicione cartão brasileiro (Nubank, Inter, C6, etc.)
4. Confirme upgrade ($19/mês)
```

#### **1.4 Obter Connection String**
```
1. No dashboard do database "fisioflow"
2. Vá em "Connection details"
3. Copie a connection string:
   postgresql://username:password@ep-xxx.neon.tech/fisioflow
4. Salve em local seguro
```

### **PASSO 2: CRIAR CONTA RAILWAY (10 MINUTOS)**

#### **2.1 Acessar e Criar Conta**
```
1. Acesse: https://railway.app/
2. Clique "Start a New Project"
3. Escolha "Login with GitHub"
4. Autorize Railway no GitHub
```

#### **2.2 Configurar Plano Pro**
```
1. Vá em "Settings" → "Billing"
2. Clique "Upgrade to Pro"
3. Adicione mesmo cartão brasileiro
4. Confirme upgrade ($25/mês)
```

#### **2.3 Criar Projeto**
```
1. No dashboard, clique "New Project"
2. Escolha "Empty Project"
3. Nome: fisioflow-production
4. Clique "Create"
```

### **PASSO 3: CONFIGURAR VARIÁVEIS (10 MINUTOS)**

#### **3.1 Instalar Railway CLI**
```bash
# No terminal/cmd
npm install -g @railway/cli

# Verificar instalação
railway --version
```

#### **3.2 Fazer Login e Conectar**
```bash
# Login no Railway
railway login

# Navegar para pasta do projeto
cd seu-projeto-fisioflow

# Conectar ao projeto Railway
railway link
# Escolha: fisioflow-production
```

#### **3.3 Configurar Variáveis de Ambiente**
```bash
# Adicionar DATABASE_URL (usar string do Neon)
railway variables set DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/fisioflow"

# Adicionar outras variáveis
railway variables set NODE_ENV="production"
railway variables set NEXTAUTH_SECRET="seu-secret-super-seguro-aqui"

# Verificar variáveis
railway variables
```

---

## 💻 FASE 2: CONFIGURAR CURSOR IDE

### **PASSO 4: INSTALAR CURSOR IDE (5 MINUTOS)**

#### **4.1 Download e Instalação**
```
1. Acesse: https://cursor.sh/
2. Clique "Download for [seu-OS]"
3. Instale normalmente
4. Abra Cursor IDE
```

#### **4.2 Configurar Claude Pro**
```
1. No Cursor, pressione Cmd/Ctrl + ,
2. Vá em "Cursor" → "General"
3. Em "AI Provider", escolha "Claude"
4. Adicione sua API key do Claude Pro
5. Salve configurações
```

#### **4.3 Abrir Projeto**
```
1. File → Open Folder
2. Selecione pasta do seu projeto FisioFlow
3. Cursor vai indexar o projeto
```

### **PASSO 5: CONFIGURAR PROJETO BASE (10 MINUTOS)**

#### **5.1 Instalar Dependências**
```bash
# No terminal do Cursor (Ctrl + `)
npm install prisma @prisma/client
npm install @types/node typescript ts-node
npm install dotenv
```

#### **5.2 Configurar Prisma**
```bash
# Inicializar Prisma
npx prisma init

# Vai criar:
# - prisma/schema.prisma
# - .env
```

#### **5.3 Configurar .env**
```bash
# Editar .env
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/fisioflow"
```

---

## 🎯 FASE 3: PROMPTS PARA CURSOR IDE

### **PROMPT 1: CONFIGURAÇÃO INICIAL DO PROJETO**

```
Olá Claude! Sou desenvolvedor do FisioFlow, sistema de gestão para clínicas de fisioterapia.

CONTEXTO:
- Projeto React + TypeScript + Vite existente
- Infraestrutura: Neon (PostgreSQL) + Railway
- Objetivo: Reestruturar projeto com melhores práticas

TAREFA 1: Configurar Prisma Schema para PostgreSQL
Crie um schema.prisma completo com:

1. Configuração para PostgreSQL/Neon
2. Modelos principais:
   - User (admin, fisioterapeuta, estagiário, paciente)
   - Clinic (clínicas)
   - Patient (pacientes)
   - PainPoint (pontos de dor no mapa corporal)
   - Session (sessões de fisioterapia)
   - Exercise (exercícios)
   - Prescription (prescrições de exercícios)

3. Relacionamentos corretos
4. Índices otimizados
5. Tipos PostgreSQL nativos (JSONB, POINT, TIMESTAMPTZ)

REQUISITOS ESPECÍFICOS:
- PainPoint deve usar tipo POINT para coordenadas
- Dados médicos em JSONB
- Soft delete em registros importantes
- Auditoria (createdAt, updatedAt)
- Constraints de validação

Por favor, crie o schema.prisma completo e explique cada modelo.
```

### **PROMPT 2: ESTRUTURA DE PASTAS E ARQUITETURA**

```
TAREFA 2: Reestruturar arquitetura do projeto

Baseado no schema Prisma criado, reorganize a estrutura de pastas:

ESTRUTURA ATUAL (básica):
src/
├── components/
├── pages/
├── hooks/
├── services/
└── types/

ESTRUTURA DESEJADA (profissional):
src/
├── app/                 # App router/providers
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── forms/          # Formulários específicos
│   ├── medical/        # Componentes médicos
│   └── layout/         # Layout components
├── features/           # Features por domínio
│   ├── auth/
│   ├── patients/
│   ├── exercises/
│   ├── body-map/       # Mapa corporal
│   └── sessions/
├── lib/                # Utilitários e configurações
│   ├── prisma.ts       # Cliente Prisma
│   ├── auth.ts         # Configuração auth
│   ├── utils.ts        # Utilitários gerais
│   └── validations.ts  # Schemas Zod
├── hooks/              # Custom hooks
├── types/              # Tipos TypeScript
└── constants/          # Constantes da aplicação

TAREFAS:
1. Crie a estrutura de pastas completa
2. Configure cliente Prisma otimizado
3. Crie tipos TypeScript baseados no schema
4. Configure validações com Zod
5. Crie hooks básicos para cada feature

Implemente esta estrutura e explique a organização.
```

### **PROMPT 3: SISTEMA DE AUTENTICAÇÃO**

```
TAREFA 3: Implementar sistema de autenticação completo

REQUISITOS:
1. NextAuth.js com múltiplos providers
2. Roles: ADMIN, FISIOTERAPEUTA, ESTAGIARIO, PACIENTE
3. Middleware de proteção de rotas
4. Context de autenticação
5. Hooks personalizados

FUNCIONALIDADES:
- Login com email/senha
- Login com Google
- Registro de usuários
- Recuperação de senha
- Proteção de rotas por role
- Sessão persistente

IMPLEMENTAR:
1. Configuração NextAuth.js
2. Providers (credentials + Google)
3. Callbacks personalizados
4. Middleware de rotas
5. AuthContext + useAuth hook
6. Componentes de login/registro
7. Proteção de páginas

Crie implementação completa com TypeScript e explique cada parte.
```

### **PROMPT 4: MAPA CORPORAL INTERATIVO**

```
TAREFA 4: Implementar sistema de mapa corporal interativo

CONTEXTO:
Este é o diferencial do FisioFlow - mapa corporal onde fisioterapeutas marcam pontos de dor dos pacientes.

FUNCIONALIDADES:
1. SVG interativo do corpo humano (frente/costas)
2. Clique para adicionar pontos de dor
3. Escala de dor 0-10 com cores
4. Timeline de evolução
5. Anotações por ponto
6. Export para PDF

COMPONENTES NECESSÁRIOS:
1. BodyMap - Componente principal
2. BodyMapSVG - SVG interativo
3. PainPointModal - Modal para adicionar/editar
4. PainTimeline - Timeline de evolução
5. useBodyMap - Hook personalizado

REQUISITOS TÉCNICOS:
- Responsivo (desktop/tablet/mobile)
- Touch-friendly
- Coordenadas em porcentagem (0-100)
- Persistência no PostgreSQL (tipo POINT)
- Animações suaves
- Acessibilidade (WCAG 2.1)

CORES DA ESCALA DE DOR:
- 0-2: Verde (#10b981 → #6ee7b7)
- 3-5: Amarelo/Laranja (#fbbf24 → #f97316)
- 6-8: Vermelho (#dc2626 → #b91c1c)
- 9-10: Vermelho escuro (#991b1b → #7f1d1d)

Implemente o sistema completo de mapa corporal com todos os componentes.
```

### **PROMPT 5: GESTÃO DE PACIENTES**

```
TAREFA 5: Implementar sistema completo de gestão de pacientes

FUNCIONALIDADES:
1. CRUD completo de pacientes
2. Prontuário eletrônico
3. Histórico médico
4. Agendamento de sessões
5. Prescrição de exercícios
6. Relatórios de evolução

PÁGINAS/COMPONENTES:
1. Lista de pacientes (tabela + filtros)
2. Formulário de cadastro/edição
3. Perfil do paciente (dashboard)
4. Prontuário médico
5. Histórico de sessões
6. Mapa corporal integrado

FEATURES AVANÇADAS:
- Busca inteligente (nome, CPF, email)
- Filtros por status, fisioterapeuta, data
- Export de dados (PDF, Excel)
- Fotos do paciente
- Documentos anexos
- Notificações automáticas

VALIDAÇÕES:
- CPF válido
- Email único
- Campos obrigatórios
- Validação de idade
- Formato de telefone

Implemente o sistema completo de gestão de pacientes com todas as funcionalidades.
```

### **PROMPT 6: SISTEMA DE EXERCÍCIOS**

```
TAREFA 6: Implementar biblioteca de exercícios e prescrições

FUNCIONALIDADES:
1. Biblioteca de exercícios categorizada
2. Sistema de prescrição personalizada
3. Vídeos demonstrativos
4. Acompanhamento de aderência
5. Feedback do paciente

CATEGORIAS DE EXERCÍCIOS:
- Mobilização Neural
- Cervical
- Membros Superiores
- Tronco
- Membros Inferiores
- Fortalecimento
- Alongamento
- Propriocepção

COMPONENTES:
1. ExerciseLibrary - Biblioteca principal
2. ExerciseCard - Card de exercício
3. ExerciseModal - Detalhes do exercício
4. PrescriptionForm - Formulário de prescrição
5. PatientExercises - Exercícios do paciente
6. ProgressTracking - Acompanhamento

FEATURES:
- Upload de vídeos
- Favoritos
- Avaliação com estrelas
- Comentários
- Dificuldade (1-5)
- Duração estimada
- Equipamentos necessários

Implemente o sistema completo de exercícios com biblioteca e prescrições.
```

### **PROMPT 7: DASHBOARD E RELATÓRIOS**

```
TAREFA 7: Implementar dashboard executivo e sistema de relatórios

DASHBOARDS POR PERFIL:
1. Admin - Métricas gerais da clínica
2. Fisioterapeuta - Seus pacientes e sessões
3. Paciente - Sua evolução e exercícios

MÉTRICAS PRINCIPAIS:
- Total de pacientes ativos
- Sessões realizadas (mês/semana)
- Taxa de aderência aos exercícios
- Evolução da dor (média)
- Receita mensal
- Pacientes por fisioterapeuta

GRÁFICOS:
- Evolução da dor (linha temporal)
- Distribuição de exercícios (pizza)
- Sessões por mês (barras)
- Aderência por paciente (barras horizontais)
- Mapa de calor corporal (pontos de dor mais comuns)

RELATÓRIOS:
- Relatório de evolução do paciente
- Relatório mensal da clínica
- Relatório de aderência
- Relatório financeiro
- Export em PDF

COMPONENTES:
1. DashboardLayout
2. MetricCard
3. ChartContainer
4. ReportGenerator
5. DateRangePicker

Implemente dashboard completo com gráficos e relatórios usando Chart.js ou Recharts.
```

### **PROMPT 8: DEPLOY E OTIMIZAÇÃO**

```
TAREFA 8: Preparar projeto para deploy e otimizar performance

OTIMIZAÇÕES:
1. Code splitting por rotas
2. Lazy loading de componentes
3. Otimização de imagens
4. Caching de queries
5. Bundle analysis

CONFIGURAÇÕES DE DEPLOY:
1. Build otimizado para produção
2. Variáveis de ambiente
3. Health checks
4. Logging estruturado
5. Error tracking

RAILWAY DEPLOY:
1. Dockerfile otimizado
2. Railway.json configurado
3. Scripts de build
4. Migrations automáticas
5. Rollback strategy

MONITORAMENTO:
- Performance metrics
- Error tracking (Sentry)
- Database monitoring
- User analytics
- Uptime monitoring

TAREFAS:
1. Configure build otimizado
2. Implemente lazy loading
3. Configure error boundaries
4. Prepare scripts de deploy
5. Configure monitoramento

Prepare o projeto completo para produção com todas as otimizações.
```

---

## 📋 SEQUÊNCIA DE EXECUÇÃO

### **ORDEM DOS PROMPTS:**
1. **Prompt 1** - Configuração inicial (Prisma + estrutura)
2. **Prompt 2** - Arquitetura e organização
3. **Prompt 3** - Sistema de autenticação
4. **Prompt 4** - Mapa corporal (diferencial)
5. **Prompt 5** - Gestão de pacientes
6. **Prompt 6** - Sistema de exercícios
7. **Prompt 7** - Dashboard e relatórios
8. **Prompt 8** - Deploy e otimização

### **TEMPO ESTIMADO:**
- **Prompt 1-2**: 2 horas (base sólida)
- **Prompt 3**: 1 hora (autenticação)
- **Prompt 4**: 3 horas (mapa corporal complexo)
- **Prompt 5**: 2 horas (gestão pacientes)
- **Prompt 6**: 2 horas (exercícios)
- **Prompt 7**: 2 horas (dashboard)
- **Prompt 8**: 1 hora (deploy)

**Total: 13 horas de desenvolvimento assistido**

---

## 🎯 DICAS IMPORTANTES

### **Para usar no Cursor IDE:**
1. **Cole um prompt por vez**
2. **Aguarde implementação completa**
3. **Teste cada funcionalidade**
4. **Use Cmd/Ctrl + K** para ajustes específicos
5. **Salve progresso** antes do próximo prompt

### **Comandos úteis:**
```bash
# Gerar Prisma Client
npx prisma generate

# Aplicar migrations
npx prisma db push

# Visualizar banco
npx prisma studio

# Build do projeto
npm run build

# Deploy Railway
git push origin main
```

### **Estrutura final esperada:**
- ✅ Sistema completo de fisioterapia
- ✅ Mapa corporal interativo
- ✅ Gestão de pacientes
- ✅ Biblioteca de exercícios
- ✅ Dashboard executivo
- ✅ Deploy automatizado
- ✅ Performance otimizada

**Está pronto para começar? Vamos implementar o FisioFlow completo!** 🚀

