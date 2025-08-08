# 🏥 FisioFlow - Sistema de Gestão para Clínicas de Fisioterapia

<div align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Railway-Deploy-0B0D0E?style=for-the-badge&logo=railway" alt="Railway" />
</div>

## 🚀 Visão Geral

**FisioFlow** é um sistema profissional e moderno para gestão completa de clínicas de fisioterapia, desenvolvido com as mais recentes tecnologias web. O diferencial único é o **Mapa Corporal Interativo**, que permite aos fisioterapeutas marcar visualmente os pontos de dor dos pacientes e acompanhar sua evolução ao longo do tempo.

### ✨ Principais Diferenciais

- 🗺️ **Mapa Corporal Interativo** - Marcação visual de pontos de dor com escala de intensidade
- 📊 **Dashboard Executivo** - Métricas e indicadores em tempo real
- 🎯 **Sistema de Gamificação** - Engajamento dos pacientes através de conquistas
- 📱 **Portal do Paciente** - Acesso dedicado para acompanhamento pessoal
- 🤖 **AI Assistente** - Sugestões inteligentes baseadas em IA
- 📈 **Analytics Avançado** - Relatórios detalhados e insights preditivos

## 🎯 Funcionalidades Principais

### 🗺️ **Mapa Corporal Interativo**
- **SVG Interativo**: Visualização frente e costas do corpo humano
- **Pontos de Dor**: Sistema de marcação com escala 0-10 e cores visuais
- **Timeline de Evolução**: Histórico temporal completo dos pontos de dor
- **Comparação Temporal**: Análise antes/depois com gráficos de tendência
- **Export PDF**: Relatórios profissionais para compartilhamento
- **Mobile-First**: Totalmente responsivo e touch-friendly

### 🧠 **IA Avançada**
- **Predição de Aderência**: Análise de 26+ variáveis para prever risco de abandono
- **IA Econômica**: Otimização automática de recursos e predição de demanda
- **Intervenções Personalizadas**: Estratégias de retenção geradas automaticamente
- **Análise de Padrões**: Insights sobre recuperação por tipo de lesão

### 🎮 **Gamificação Completa**
- Sistema de pontos com multiplicadores dinâmicos
- Badges com níveis de raridade (Bronze, Prata, Ouro, Platina)
- Desafios personalizados baseados no progresso
- Competições em grupo e rankings

### 📊 **Dashboard Econômico**
- Métricas financeiras em tempo real
- Análise de ROI e eficiência de recursos
- Previsões de receita com ajustes sazonais
- Otimização de agendamentos e utilização de salas

### 🏥 **Gestão Clínica Completa**
- Prontuário eletrônico integrado
- Sistema SOAP para anotações
- Biblioteca de exercícios personalizada
- Acompanhamento de evolução por lesão

## 🏗️ Arquitetura

### **Clean Architecture**
```
src/
├── domain/              # Entidades e regras de negócio
│   ├── entities/        # Patient, PainPoint, Session
│   ├── repositories/    # Interfaces dos repositórios
│   └── services/        # Serviços de domínio
├── application/         # Casos de uso
│   ├── dto/            # Data Transfer Objects
│   └── use-cases/      # Lógica de aplicação
├── infrastructure/      # Implementações técnicas
│   ├── database/       # Prisma, migrations
│   └── external/       # APIs externas
└── presentation/        # Interfaces (React components)
    ├── components/     # Componentes React
    ├── pages/          # Páginas da aplicação
    └── hooks/          # Custom hooks
```

### **Estrutura de Componentes - Mapa Corporal**
```
components/medical/BodyMap/
├── BodyMap.tsx              # Componente principal
├── BodyMapSVG.tsx           # SVG interativo do corpo
├── PainTimeline.tsx         # Timeline de evolução
├── AddPainPointModal.tsx    # Modal para adicionar pontos
├── useBodyMap.ts            # Hook personalizado
└── types.ts                 # Tipos TypeScript
```

### 🛠️ **Stack Tecnológica**

#### **Frontend**
- **React 19.1.1** + **TypeScript** + **Next.js 14**
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **Context API** + Custom Hooks para estado

#### **Backend & Infraestrutura**
- **Railway** - Platform as a Service
- **Neon** - PostgreSQL serverless
- **Prisma ORM** - Database toolkit
- **Redis** - Cache e sessões

#### **IA & Analytics**
- **Gemini AI** - Predições e análises
- **Recharts** - Visualizações de dados
- **HTML2PDF** - Geração de relatórios

#### **Qualidade & Testes**
- **Jest** + **React Testing Library**
- **TypeScript** em modo estrito
- **ESLint** + **Prettier**

## 📦 Instalação e Setup

### **Pré-requisitos**
- **Node.js 18+**
- **npm** ou **yarn**
- **Conta Railway** (para deploy)
- **Conta Neon** (para database PostgreSQL)
- **Cursor IDE** com Claude Pro (recomendado)

### **1. Setup Local**

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/fisioflow.git
cd fisioflow

# Instalar dependências
npm install

# Instalar Prisma CLI globalmente
npm install -g prisma

# Instalar dependências específicas do projeto
npm install prisma @prisma/client @planetscale/database mysql2
```

### **2. Configuração do Banco de Dados**

#### **Setup Neon + Railway**
Siga o [Guia Completo de Setup](docs/SETUP_GUIDE.md) para configurar a infraestrutura completa.

#### **Configurar Prisma**
```bash
# Inicializar Prisma
npx prisma init

# Gerar Prisma Client
npx prisma generate

# Push schema para Neon PostgreSQL
npx prisma db push
```

### **3. Variáveis de Ambiente**

Crie um arquivo `.env.local`:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/fisioflow"

# Authentication
NEXTAUTH_SECRET="seu-secret-super-secreto"
NEXTAUTH_URL="http://localhost:3000"

# AI Services
GEMINI_API_KEY="sua-chave-gemini"

# Redis (opcional para desenvolvimento)
REDIS_URL="redis://localhost:6379"

# Feature Flags
ENABLE_BODY_MAP=true
ENABLE_AI_ANALYTICS=true
ENABLE_GAMIFICATION=true
```

### **4. Desenvolvimento**

```bash
# Executar em modo desenvolvimento
npm run dev

# Executar com Prisma Studio (visualização do banco)
npx prisma studio

# Executar testes
npm test

# Executar testes com watch
npm run test:watch
```

## 📋 Scripts Disponíveis

### **Desenvolvimento**
- `npm run dev` - Servidor de desenvolvimento Next.js
- `npm run build` - Build para produção
- `npm run start` - Servidor de produção
- `npm run preview` - Preview do build

### **Database**
- `npx prisma generate` - Gerar Prisma Client
- `npx prisma db push` - Fazer push do schema
- `npx prisma studio` - Interface visual do banco
- `npx prisma migrate dev` - Criar nova migration

### **Qualidade**
- `npm test` - Executar testes
- `npm run test:watch` - Testes em modo watch
- `npm run test:coverage` - Cobertura de testes
- `npm run lint` - Verificar código
- `npm run typecheck` - Verificar tipos TypeScript

## 🚀 Deploy Automatizado

### **Railway + Neon**

1. **Conectar Railway ao GitHub**
2. **Configurar variáveis de ambiente no Railway**
3. **Deploy automático a cada push**
4. **Migrations automáticas com Prisma**

```bash
# CLI Railway (opcional)
npm install -g @railway/cli
railway login
railway init
railway deploy
```

### **Vercel (Alternativa)**

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático configurado

## 🗺️ **Funcionalidade Principal: Mapa Corporal**

### **Como Usar**

1. **Acesse o prontuário do paciente**
2. **Clique em "Mapa Corporal"**
3. **Clique no corpo para marcar pontos de dor**
4. **Defina a intensidade (0-10) e adicione anotações**
5. **Use o timeline para ver a evolução**
6. **Exporte relatórios em PDF**

### **Integração com APIs**

```typescript
// Exemplo de uso da API do Mapa Corporal
import { useBodyMap } from '@/hooks/useBodyMap';

const { painPoints, addPainPoint, updatePainPoint } = useBodyMap(patientId);

// Adicionar novo ponto de dor
await addPainPoint({
  x: 50, y: 30,
  intensity: 7,
  bodyPart: 'shoulder_left',
  side: 'FRONT',
  notes: 'Dor após exercício'
});
```

## 🔒 Segurança e Compliance

- **Autenticação**: NextAuth.js com múltiplos provedores
- **Autorização**: RBAC (Role-Based Access Control)
- **Criptografia**: Dados sensíveis criptografados
- **LGPD/GDPR**: Compliance com regulações de dados
- **Rate Limiting**: Proteção contra ataques
- **Headers de Segurança**: CSP, HSTS, etc.

## 🧪 Testes

### **Estrutura de Testes**
```
tests/
├── components/         # Testes de componentes React
├── services/          # Testes de serviços
├── hooks/             # Testes de custom hooks
├── utils/             # Testes de utilitários
└── __mocks__/         # Mocks para testes
```

### **Executar Testes**
```bash
# Todos os testes
npm test

# Testes específicos
npm test -- --testPathPattern=BodyMap

# Com cobertura
npm run test:coverage
```

## 📊 Monitoramento

### **Performance Monitoring**
- Query performance tracking
- Component render monitoring
- User interaction analytics

### **Health Checks**
```bash
# Verificar saúde do sistema
curl http://localhost:3000/api/health
```

## 🤝 Contribuição

### **Fluxo de Desenvolvimento**

1. **Fork o projeto**
2. **Crie uma branch para sua feature**
   ```bash
   git checkout -b feature/mapa-corporal-3d
   ```
3. **Implemente seguindo as convenções**
   - Use TypeScript strict mode
   - Adicione testes para novas funcionalidades
   - Documente APIs públicas
   - Siga os padrões de UI/UX existentes

4. **Commit com mensagens descritivas**
   ```bash
   git commit -m "feat: adiciona visualização 3D no mapa corporal"
   ```

5. **Push e abra um Pull Request**

### **Convenções de Código**
- **Componentes**: PascalCase
- **Hooks**: camelCase iniciado com "use"
- **Arquivos**: kebab-case
- **Funções**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Commits**: Conventional Commits (feat:, fix:, docs:, etc.)

## 📚 Documentação Técnica

- [🏗️ Arquitetura do Sistema](docs/ARCHITECTURE.md)
- [🚀 Setup Completo Neon + Railway](docs/SETUP_GUIDE.md)
- [🎯 Prompts Sequenciais Cursor IDE](docs/CURSOR_PROMPTS.md)
- [🗺️ Guia do Mapa Corporal](docs/BODY_MAP_GUIDE.md)
- [🔌 API Reference](docs/API_REFERENCE.md)
- [🧪 Guia de Testes](docs/TESTING_GUIDE.md)
- [🔒 Segurança](docs/SECURITY.md)

## 📄 Licença

Este projeto está sob licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/fisioflow/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/seu-usuario/fisioflow/wiki)
- **Email**: suporte@fisioflow.com.br

---

---

## 🎯 Guia de Implementação Rápida

### 📖 Para usar os Prompts do Cursor IDE

Este projeto foi otimizado para desenvolvimento assistido por IA usando **Cursor IDE** com **Claude Pro**:

1. **Siga o [SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** - Configure Neon + Railway primeiro
2. **Use os [CURSOR_PROMPTS.md](docs/CURSOR_PROMPTS.md)** - 8 prompts sequenciais 
3. **Execute um prompt por vez** no Cursor IDE (Cmd/Ctrl + L)
4. **Aguarde implementação completa** antes do próximo prompt
5. **Teste cada funcionalidade** implementada

**Tempo estimado: 13 horas de desenvolvimento assistido** ⚡

### 🚀 Resultado Final Esperado

Após executar todos os prompts, você terá:
- ✅ Sistema completo de fisioterapia
- ✅ Mapa corporal interativo (diferencial único)
- ✅ Autenticação multi-role com NextAuth.js
- ✅ Dashboard executivo com métricas em tempo real
- ✅ Gestão completa de pacientes e exercícios
- ✅ Deploy automatizado no Railway

---

<div align="center">
  <p><strong>🏥 Desenvolvido com ❤️ para transformar a fisioterapia através da tecnologia</strong></p>
  <p>
    <a href="#-fisioflow---sistema-de-gestão-para-clínicas-de-fisioterapia">⬆️ Voltar ao topo</a>
  </p>
</div>
