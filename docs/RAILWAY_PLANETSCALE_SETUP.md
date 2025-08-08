# 🚀 SETUP RAILWAY + PLANETSCALE - GUIA COMPLETO

Este guia fornece instruções passo a passo para configurar a infraestrutura do FisioFlow usando Railway como plataforma de deploy e PlanetScale como banco de dados MySQL serverless.

## 🎯 **OVERVIEW DA ARQUITETURA**

```mermaid
graph TB
    A[GitHub Repository] --> B[Railway Platform]
    B --> C[FisioFlow App]
    C --> D[PlanetScale Database]
    C --> E[Redis Cache]
    F[Desenvolvimento Local] --> G[PlanetScale Branch]
```

## 📋 **PRÉ-REQUISITOS**

- **Node.js 18+** instalado
- **Conta GitHub** ativa
- **Cartão de crédito** para as contas Pro
- **Terminal** com acesso aos comandos npm/git

## 🚀 **PASSO 1: CRIAR CONTAS (5 MINUTOS)**

### **1.1 Criar Conta PlanetScale**

1. **Acesse**: https://planetscale.com/
2. **Clique em** "Sign up"
3. **Use seu email** do GitHub/Google para facilitar
4. **Escolha plano "Scaler"** ($39/mês - recomendado para produção)
5. **Confirme seu email**

> 💡 **Dica**: PlanetScale oferece 10GB grátis para desenvolvimento

### **1.2 Criar Conta Railway**

1. **Acesse**: https://railway.app/
2. **Clique em** "Start a New Project"  
3. **Conecte com GitHub** (necessário para deploy automático)
4. **Escolha plano "Pro"** ($20/mês - necessário para produção)
5. **Adicione método de pagamento**

> 💡 **Dica**: Railway oferece $5 de crédito grátis para testes

## 🔧 **PASSO 2: CONFIGURAR PLANETSCALE (10 MINUTOS)**

### **2.1 Instalar PlanetScale CLI**

```bash
# Instalar PlanetScale CLI globalmente
npm install -g @planetscale/cli

# Verificar instalação
pscale version
# Deve retornar algo como: pscale version v0.134.0
```

### **2.2 Autenticar no PlanetScale**

```bash
# Login no PlanetScale
pscale auth login

# Seguir instruções no browser que abrirá automaticamente
# Autorizar o acesso quando solicitado
```

### **2.3 Criar Database Principal**

```bash
# Criar banco principal para produção
pscale database create fisioflow --region us-east

# Criar branch de desenvolvimento
pscale branch create fisioflow development

# Listar bancos para confirmar
pscale database list
```

**Output esperado:**
```
NAME          REGION   STATUS
fisioflow     us-east  ready
```

### **2.4 Configurar Connection Strings**

```bash
# Gerar password para produção (branch main)
pscale password create fisioflow main fisioflow-prod

# COPIE E GUARDE A CONNECTION STRING QUE APARECERÁ
# Formato: mysql://username:password@host/database?sslaccept=strict
```

**Exemplo de output:**
```
Password created.
Please save the values below as they will not be shown again

  NAME                  USERNAME             ACCESS HOST URL                           ROLE               
  fisioflow-prod        xxxxxxxxx           xxxxxxxxx.us-east-1.psdb.cloud           readwriter         

  CONNECTION STRING
  mysql://username:password@host/fisioflow?sslaccept=strict
```

## 🚂 **PASSO 3: CONFIGURAR RAILWAY (10 MINUTOS)**

### **3.1 Instalar Railway CLI**

```bash
# Instalar Railway CLI globalmente
npm install -g @railway/cli

# Verificar instalação
railway --version
# Deve retornar algo como: @railway/cli/3.5.0
```

### **3.2 Autenticar no Railway**

```bash
# Login no Railway
railway login

# Seguir instruções no browser
# Autorizar acesso quando solicitado
```

### **3.3 Inicializar Projeto Railway**

```bash
# No diretório raiz do seu projeto FisioFlow
cd fisioflow

# Inicializar Railway
railway init

# Escolher "Create new project"
# Nome sugerido: fisioflow-production
```

### **3.4 Configurar Variáveis de Ambiente**

```bash
# Adicionar DATABASE_URL (usar a string copiada do PlanetScale)
railway variables set DATABASE_URL="mysql://username:password@host/fisioflow?sslaccept=strict"

# Configurar ambiente de produção
railway variables set NODE_ENV="production"

# Configurar NextAuth
railway variables set NEXTAUTH_SECRET="$(openssl rand -base64 32)"
railway variables set NEXTAUTH_URL="https://fisioflow-production.up.railway.app"

# Configurar Gemini AI
railway variables set GEMINI_API_KEY="sua-chave-gemini-aqui"

# Feature Flags
railway variables set ENABLE_BODY_MAP="true"
railway variables set ENABLE_AI_ANALYTICS="true"

# Listar variáveis para confirmar
railway variables
```

## 📦 **PASSO 4: CONFIGURAR PROJETO (15 MINUTOS)**

### **4.1 Instalar Dependências do Prisma**

```bash
# Instalar Prisma e dependências relacionadas
npm install prisma @prisma/client @planetscale/database mysql2

# Instalar como dependências de desenvolvimento
npm install --save-dev prisma
```

### **4.2 Inicializar Prisma**

```bash
# Inicializar Prisma (vai criar pasta prisma/)
npx prisma init
```

### **4.3 Configurar Schema Prisma Completo**

Edite o arquivo `prisma/schema.prisma` com o schema completo:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"
}

// ======================================
// MODELOS PRINCIPAIS
// ======================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole @default(FISIOTERAPEUTA)
  clinicId  String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  clinic    Clinic?  @relation(fields: [clinicId], references: [id])
  patients  Patient[]
  sessions  Session[]
  
  @@index([clinicId])
  @@index([email])
  @@map("users")
}

model Clinic {
  id        String   @id @default(cuid())
  name      String
  cnpj      String?  @unique
  address   Json?
  phone     String?
  email     String?
  settings  Json?    // Configurações da clínica
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  users     User[]
  patients  Patient[]
  
  @@map("clinics")
}

model Patient {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  phone       String?
  birthDate   DateTime?
  cpf         String?  @unique
  address     Json?
  medicalInfo Json?    // Histórico médico
  preferences Json?    // Preferências do paciente
  clinicId    String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  clinic      Clinic      @relation(fields: [clinicId], references: [id])
  painPoints  PainPoint[]
  sessions    Session[]
  
  @@index([clinicId])
  @@index([email])
  @@index([cpf])
  @@map("patients")
}

// ======================================
// MAPA CORPORAL - CORE FEATURE
// ======================================

model PainPoint {
  id        String   @id @default(cuid())
  patientId String
  x         Float    // Coordenada X no SVG (0-100)
  y         Float    // Coordenada Y no SVG (0-100)
  intensity Int      @db.TinyInt // 0-10
  bodyPart  BodyPart // Parte do corpo
  side      Side     // FRONT ou BACK
  notes     String?  @db.Text // Anotações opcionais
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  patient Patient @relation(fields: [patientId], references: [id])
  
  @@index([patientId])
  @@index([createdAt])
  @@index([bodyPart])
  @@map("pain_points")
}

model Session {
  id            String    @id @default(cuid())
  patientId     String
  userId        String
  date          DateTime
  duration      Int?      // minutos
  notes         String?   @db.Text
  exercises     Json?     // Lista de exercícios realizados
  painLevel     Int?      @db.TinyInt // 0-10
  status        SessionStatus @default(SCHEDULED)
  type          SessionType   @default(INDIVIDUAL)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  patient Patient @relation(fields: [patientId], references: [id])
  user    User    @relation(fields: [userId], references: [id])
  
  @@index([patientId])
  @@index([userId])
  @@index([date])
  @@index([status])
  @@map("sessions")
}

// ======================================
// ENUMS
// ======================================

enum UserRole {
  ADMIN
  FISIOTERAPEUTA
  ESTAGIARIO
  PACIENTE
}

enum Side {
  FRONT
  BACK
}

enum BodyPart {
  // Cabeça e pescoço
  head
  neck
  
  // Membros superiores
  shoulder_left
  shoulder_right
  arm_left
  arm_right
  elbow_left
  elbow_right
  forearm_left
  forearm_right
  wrist_left
  wrist_right
  hand_left
  hand_right
  
  // Tronco
  chest
  back_upper
  back_lower
  abdomen
  
  // Membros inferiores
  hip_left
  hip_right
  thigh_left
  thigh_right
  knee_left
  knee_right
  leg_left
  leg_right
  ankle_left
  ankle_right
  foot_left
  foot_right
}

enum SessionStatus {
  SCHEDULED   // Agendada
  IN_PROGRESS // Em andamento
  COMPLETED   // Concluída
  CANCELLED   // Cancelada
  NO_SHOW     // Faltou
}

enum SessionType {
  INDIVIDUAL  // Individual
  GROUP       // Em grupo
  ONLINE      // Teleconsulta
}
```

### **4.4 Configurar Environment Files**

Crie `.env.local` para desenvolvimento:

```env
# .env.local (Desenvolvimento)

# Database - Conexão local via proxy
DATABASE_URL="mysql://root@127.0.0.1:3309/fisioflow"

# NextAuth
NEXTAUTH_SECRET="seu-secret-local-super-secreto"
NEXTAUTH_URL="http://localhost:3000"

# Gemini AI
GEMINI_API_KEY="sua-chave-gemini"

# Feature Flags
ENABLE_BODY_MAP=true
ENABLE_AI_ANALYTICS=true
ENABLE_GAMIFICATION=true

# Debug
PRISMA_LOG_QUERIES=false
```

### **4.5 Gerar e Sincronizar Schema**

```bash
# Gerar Prisma Client
npx prisma generate

# Push schema para PlanetScale (produção)
npx prisma db push

# Verificar se funcionou
npx prisma studio
```

## 🚀 **PASSO 5: PRIMEIRO DEPLOY (5 MINUTOS)**

### **5.1 Atualizar package.json**

Adicione/atualize os scripts no `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "preview": "next start",
    
    // Scripts do Prisma
    "postinstall": "prisma generate",
    "db:generate": "prisma generate",
    "db:push": "prisma db push", 
    "db:studio": "prisma studio",
    
    // Scripts de qualidade
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

### **5.2 Configurar Build Command no Railway**

No Railway Dashboard:
1. Vá para seu projeto
2. Clique em "Settings"
3. Configure:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`

### **5.3 Fazer Deploy**

```bash
# Adicionar arquivos ao git (se ainda não estiver)
git add .
git commit -m "feat: setup Railway + PlanetScale infrastructure"

# Push para o GitHub (Railway detecta automaticamente)
git push origin main

# Railway fará deploy automático em ~2-3 minutos
```

### **5.4 Verificar Deploy**

```bash
# Ver logs do deploy
railway logs

# Obter URL do projeto deployed
railway domain

# Testar se está funcionando
curl https://seu-app.up.railway.app/api/health
```

## 🔧 **PASSO 6: CONFIGURAÇÕES AVANÇADAS (10 MINUTOS)**

### **6.1 Configurar Domínio Personalizado (Opcional)**

```bash
# Adicionar domínio personalizado
railway domain add fisioflow.com.br

# No seu provedor de DNS, configure:
# CNAME: fisioflow.com.br -> [railway-url].up.railway.app
```

### **6.2 Setup Ambiente de Desenvolvimento**

```bash
# Em um terminal, conectar ao branch de desenvolvimento
pscale connect fisioflow development --port 3309

# Em outro terminal, testar conexão local
npx prisma studio

# Deve abrir http://localhost:5555 mostrando as tabelas
```

### **6.3 Configurar Scripts de Backup**

Crie `scripts/backup.sh`:

```bash
#!/bin/bash

# scripts/backup.sh
echo "🔄 Criando backup do banco de dados..."

# Criar backup
pscale backup create fisioflow main --name "backup-$(date +%Y%m%d-%H%M%S)"

echo "✅ Backup criado com sucesso!"

# Listar backups
pscale backup list fisioflow main
```

```bash
# Dar permissão de execução
chmod +x scripts/backup.sh

# Executar
./scripts/backup.sh
```

## 📊 **PASSO 7: MONITORAMENTO E ALERTAS**

### **7.1 Configurar Alertas Railway**

No Railway Dashboard:
1. **Acesse** "Metrics" do seu projeto
2. **Configure alertas** para:
   - CPU > 80%
   - Memory > 90%
   - Response Time > 2s
   - Error Rate > 5%

### **7.2 Health Check Endpoint**

Crie `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Testar conexão com o banco
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

### **7.3 Configurar Monitoring**

```bash
# Testar health check
curl https://seu-app.up.railway.app/api/health

# Configurar uptime monitoring (exemplo com UptimeRobot)
# Adicionar URL: https://seu-app.up.railway.app/api/health
# Intervalo: 5 minutos
```

## 🎯 **VERIFICAÇÃO FINAL - CHECKLIST**

### **✅ Infraestrutura**
- [ ] Conta PlanetScale criada e configurada
- [ ] Conta Railway criada e configurada  
- [ ] Database `fisioflow` criado no PlanetScale
- [ ] Projeto conectado ao Railway com GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy funcionando (verificar URL)

### **✅ Database**
- [ ] Prisma schema configurado e sincronizado
- [ ] Prisma Client gerado com sucesso
- [ ] Prisma Studio acessível (localhost:5555)
- [ ] Tabelas criadas corretamente no PlanetScale

### **✅ Aplicação**
- [ ] Build passando sem erros
- [ ] Health check respondendo corretamente
- [ ] Logs sem erros críticos
- [ ] Funcionalidades básicas funcionando

### **URLs Importantes**
- **Railway Dashboard**: https://railway.app/dashboard
- **PlanetScale Dashboard**: https://app.planetscale.com/
- **Seu App**: https://fisioflow-production.up.railway.app
- **Health Check**: https://fisioflow-production.up.railway.app/api/health
- **Prisma Studio Local**: http://localhost:5555

## 🚨 **TROUBLESHOOTING**

### **Erro: "Connection refused"**

```bash
# Verificar se DATABASE_URL está correto
railway variables get DATABASE_URL

# Testar conexão direta
pscale shell fisioflow main

# Se der erro, recriar password
pscale password delete fisioflow main fisioflow-prod
pscale password create fisioflow main fisioflow-prod-new
```

### **Erro: "Build failed"**

```bash
# Ver logs detalhados do build
railway logs --tail

# Verificar se package.json tem todas as dependências
npm install

# Testar build localmente
npm run build
```

### **Erro: "Prisma generate failed"**

```bash
# Limpar cache do Prisma
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Reinstalar e regenerar
npm install
npx prisma generate
```

### **Erro: "Schema sync failed"**

```bash
# Verificar status do database
pscale database show fisioflow

# Verificar conexão
pscale connect fisioflow main --port 3306

# Push forçado (cuidado em produção!)
npx prisma db push --force-reset
```

## 💡 **BOAS PRÁTICAS DE PRODUÇÃO**

### **1. Branches Strategy**
```bash
# Sempre use branches para mudanças de schema
pscale branch create fisioflow feature/new-schema
# Teste as mudanças
# Depois faça deploy request para main
```

### **2. Monitoramento Contínuo**
- Configure alertas para métricas críticas
- Use ferramentas como Sentry para error tracking
- Monitore performance com Railway metrics

### **3. Backup Regular**
```bash
# Script automatizado para backup diário
pscale backup create fisioflow main --name "daily-$(date +%Y%m%d)"
```

### **4. Security Headers**
Configure headers de segurança no `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          }
        ],
      },
    ];
  },
};
```

## 🎉 **PRÓXIMOS PASSOS**

Após completar este setup com sucesso:

1. ✅ **Teste o sistema básico** - Verifique se todas as funcionalidades core funcionam
2. ✅ **Implemente o Mapa Corporal** - Use os componentes especificados no projeto
3. ✅ **Configure CI/CD** - Testes automáticos e deploy de staging
4. ✅ **Adicione monitoramento** - Sentry, LogRocket ou similar
5. ✅ **Configure backup automático** - Scripts para backup regular
6. ✅ **Otimize performance** - Cache Redis, CDN, etc.
7. ✅ **Documente APIs** - Para facilitar integração com outros sistemas

---

**🚀 Seu FisioFlow agora está rodando na melhor infraestrutura possível!**

Para suporte adicional, consulte:
- [Documentação Railway](https://docs.railway.app/)
- [Documentação PlanetScale](https://docs.planetscale.com/)
- [Documentação Prisma](https://www.prisma.io/docs/)