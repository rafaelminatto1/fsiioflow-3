#!/bin/bash
# scripts/setup.sh - Script de setup automático do FisioFlow

echo "🚀 FISIOFLOW - Setup Automático"
echo "================================"

# 1. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 2. Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# 3. Verificar .env
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "📝 Copiando .env.example para .env..."
    cp .env.example .env
    echo "✅ Configure suas variáveis de ambiente em .env"
else
    echo "✅ Arquivo .env encontrado"
fi

# 4. Aplicar schema no banco
echo "🗄️  Aplicando schema no banco..."
npx prisma db push

# 5. Testar conexão
echo "🧪 Testando conexão com banco..."
if npx ts-node scripts/test-schema.ts; then
    echo "✅ Conexão com banco funcionando!"
else
    echo "❌ Erro na conexão com banco. Verifique suas configurações."
    exit 1
fi

# 6. Build do projeto
echo "🏗️  Fazendo build do projeto..."
npm run build

echo ""
echo "🎉 SETUP COMPLETO!"
echo "==================="
echo ""
echo "📋 Próximos passos:"
echo "1. Configure suas variáveis em .env"
echo "2. Execute: npm run dev"
echo "3. Acesse: http://localhost:3000"
echo ""
echo "🔍 Health Check: http://localhost:3000/api/health"
echo ""