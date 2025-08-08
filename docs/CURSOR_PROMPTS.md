# 🎯 PROMPTS SEQUENCIAIS PARA CURSOR IDE - FISIOFLOW

Este documento contém todos os prompts sequenciais para implementação completa do FisioFlow usando Cursor IDE com Claude Pro.

## 📋 INSTRUÇÕES DE USO

1. **Configure Neon + Railway** primeiro (seguir SETUP_GUIDE.md)
2. **Abra Cursor IDE** no seu projeto
3. **Cole um prompt por vez** (Cmd/Ctrl + L para novo chat)
4. **Aguarde implementação completa** antes do próximo
5. **Teste cada funcionalidade** implementada

---

## 📋 PROMPT 1: CONFIGURAÇÃO INICIAL DO PROJETO

```
Olá Claude! Sou desenvolvedor do FisioFlow, sistema de gestão para clínicas de fisioterapia.

CONTEXTO:
- Projeto React + TypeScript + Next.js existente
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
- PainPoint deve usar coordenadas X,Y em Float
- Dados médicos em JSONB
- Soft delete em registros importantes
- Auditoria (createdAt, updatedAt)
- Constraints de validação

Por favor, crie o schema.prisma completo e explique cada modelo.
```

---

## 📋 PROMPT 2: ESTRUTURA DE PASTAS E ARQUITETURA

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

---

## 📋 PROMPT 3: SISTEMA DE AUTENTICAÇÃO

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

---

## 📋 PROMPT 4: MAPA CORPORAL INTERATIVO

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
- Persistência no PostgreSQL
- Animações suaves
- Acessibilidade (WCAG 2.1)

CORES DA ESCALA DE DOR:
- 0-2: Verde (#10b981 → #6ee7b7)
- 3-5: Amarelo/Laranja (#fbbf24 → #f97316)
- 6-8: Vermelho (#dc2626 → #b91c1c)
- 9-10: Vermelho escuro (#991b1b → #7f1d1d)

Implemente o sistema completo de mapa corporal com todos os componentes.
```

---

## 📋 PROMPT 5: GESTÃO DE PACIENTES

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

---

## 📋 PROMPT 6: SISTEMA DE EXERCÍCIOS

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

---

## 📋 PROMPT 7: DASHBOARD E RELATÓRIOS

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

---

## 📋 PROMPT 8: DEPLOY E OTIMIZAÇÃO

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

## 🎯 CHECKLIST DE EXECUÇÃO

### **Antes de começar:**
- [ ] ✅ Neon configurado e funcionando
- [ ] ✅ Railway configurado e conectado
- [ ] ✅ Cursor IDE instalado e configurado
- [ ] ✅ Projeto aberto no Cursor
- [ ] ✅ Claude Pro configurado no Cursor

### **Execução dos prompts:**
- [ ] ✅ Prompt 1: Schema Prisma (30 min)
- [ ] ✅ Prompt 2: Estrutura de pastas (30 min)
- [ ] ✅ Prompt 3: Autenticação (60 min)
- [ ] ✅ Prompt 4: Mapa corporal (180 min)
- [ ] ✅ Prompt 5: Gestão pacientes (120 min)
- [ ] ✅ Prompt 6: Sistema exercícios (120 min)
- [ ] ✅ Prompt 7: Dashboard (120 min)
- [ ] ✅ Prompt 8: Deploy (60 min)

### **Após cada prompt:**
- [ ] ✅ Testar funcionalidade implementada
- [ ] ✅ Verificar se não há erros
- [ ] ✅ Fazer commit das mudanças
- [ ] ✅ Documentar problemas encontrados

### **Comandos úteis entre prompts:**
```bash
# Gerar Prisma Client
npx prisma generate

# Aplicar mudanças no banco
npx prisma db push

# Visualizar banco de dados
npx prisma studio

# Testar build
npm run build

# Commit das mudanças
git add .
git commit -m "Implementação [nome da funcionalidade]"
```

## 🚀 RESULTADO FINAL ESPERADO

Após executar todos os prompts, você terá:

### **Sistema Completo:**
- ✅ **Autenticação** multi-role
- ✅ **Mapa corporal interativo** (diferencial único)
- ✅ **Gestão completa de pacientes**
- ✅ **Biblioteca de exercícios**
- ✅ **Dashboard executivo**
- ✅ **Sistema de relatórios**
- ✅ **Deploy automatizado**

### **Tecnologias Integradas:**
- ✅ **React + TypeScript + Next.js**
- ✅ **PostgreSQL (Neon) + Prisma**
- ✅ **Railway (hosting)**
- ✅ **NextAuth.js (autenticação)**
- ✅ **Tailwind CSS + shadcn/ui**
- ✅ **Chart.js/Recharts (gráficos)**

### **Performance:**
- ✅ **Code splitting** automático
- ✅ **Lazy loading** de componentes
- ✅ **Otimização de bundle**
- ✅ **Caching inteligente**
- ✅ **Error boundaries**

**Tempo total estimado: 13 horas de desenvolvimento assistido**
**Resultado: Sistema profissional completo de gestão de fisioterapia**

---

## 💡 DICAS FINAIS

1. **Não pule prompts** - cada um constrói sobre o anterior
2. **Teste após cada prompt** - identifique problemas cedo
3. **Use Cmd/Ctrl + K** para ajustes específicos no código
4. **Faça commits frequentes** - proteja seu progresso
5. **Documente problemas** - para resolver depois

**Está pronto para começar? Cole o Prompt 1 no Cursor IDE!** 🚀