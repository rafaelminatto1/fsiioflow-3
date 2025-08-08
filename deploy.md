# 🚀 Guia de Deploy - FisioFlow

## 📋 Pré-requisitos

1. **Conta Vercel Pro** ✅
2. **Conta Supabase Pro** ✅
3. **CLI do Vercel** instalado
4. **CLI do Supabase** instalado

## 🔧 Instalação das CLIs

```bash
# Instalar Vercel CLI
npm i -g vercel

# Instalar Supabase CLI
npm i -g supabase
```

## 🗄️ Configuração do Supabase

### 1. Criar Projeto no Supabase

```bash
# Login no Supabase
supabase login

# Criar novo projeto
supabase projects create fisioflow-prod --org-id [sua-org-id]

# Ou usar projeto existente
supabase link --project-ref [project-id]
```

### 2. Configurar Database

```bash
# Executar migrações
npm run db:push

# Ou executar manualmente
supabase db push
```

### 3. Obter Credenciais

No dashboard do Supabase (https://app.supabase.com):
- Vá em Settings > API
- Copie:
  - `Project URL`
  - `anon public key`
  - `service_role key` (secret)

## ☁️ Configuração do Vercel

### 1. Login e Configuração Inicial

```bash
# Login no Vercel
vercel login

# Navegar para o diretório do projeto
cd [caminho-do-projeto]

# Configurar projeto
vercel
```

### 2. Configurar Variáveis de Ambiente

```bash
# Configurar variáveis uma por uma
vercel env add DATABASE_URL
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXTAUTH_SECRET
vercel env add JWT_SECRET
vercel env add GEMINI_API_KEY
vercel env add REDIS_URL

# Ou usar arquivo .env
vercel env pull .env.production
```

### 3. Valores das Variáveis

```bash
# DATABASE_URL
postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# SUPABASE_URL
https://[project-id].supabase.co

# SUPABASE_ANON_KEY
[anon-key-do-supabase]

# SUPABASE_SERVICE_ROLE_KEY
[service-role-key-do-supabase]

# NEXTAUTH_SECRET (gerar novo)
openssl rand -base64 32

# JWT_SECRET (gerar novo)
openssl rand -base64 32

# REDIS_URL (opcional - usar Redis do Upstash)
redis://default:[password]@[host]:[port]
```

## 🚀 Deploy

### 1. Deploy Inicial

```bash
# Deploy para produção
vercel --prod

# Ou usando o script
npm run vercel-build
```

### 2. Deploy Automático (Recomendado)

1. Conecte seu repositório GitHub ao Vercel
2. Configure auto-deploy no branch `main`
3. Cada push fará deploy automático

## 🔍 Verificação Pós-Deploy

### 1. Testar Endpoints

```bash
# Health check
curl https://[seu-dominio].vercel.app/api/health

# Testar autenticação
curl https://[seu-dominio].vercel.app/api/dashboard
```

### 2. Verificar Logs

```bash
# Ver logs em tempo real
vercel logs [deployment-url] --follow

# Ver logs específicos
vercel logs [deployment-url] --since 1h
```

## 🛠️ Comandos Úteis

```bash
# Ver deployments
vercel ls

# Ver domínios
vercel domains ls

# Ver variáveis de ambiente
vercel env ls

# Rollback para deployment anterior
vercel rollback [deployment-url]

# Remover deployment
vercel rm [deployment-url]
```

## 🔒 Configuração de Domínio Personalizado

```bash
# Adicionar domínio
vercel domains add [seu-dominio.com]

# Verificar DNS
vercel domains verify [seu-dominio.com]

# Configurar SSL (automático)
# Vercel configura SSL automaticamente
```

## 📊 Monitoramento

1. **Vercel Analytics**: Habilitado automaticamente
2. **Vercel Speed Insights**: Adicionar ao projeto
3. **Supabase Dashboard**: Monitorar banco de dados

## ⚠️ Troubleshooting

### Erro de Build
```bash
# Limpar cache
vercel --force

# Build local
npm run build
```

### Erro de Database
```bash
# Verificar conexão
supabase db ping

# Resetar migrações
supabase db reset
```

### Erro de Environment Variables
```bash
# Listar variáveis
vercel env ls

# Testar localmente
vercel dev
```

## 📝 Checklist Final

- [ ] Supabase projeto criado
- [ ] Database migrado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Endpoints funcionando
- [ ] SSL configurado
- [ ] Domínio personalizado (opcional)
- [ ] Monitoramento ativo

## 🆘 Suporte

- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **Issues**: Criar issue no repositório


