#!/bin/bash

# Script de deploy para Railway
set -e

echo "🚀 Iniciando deploy do FisioFlow..."

# Verificar se estamos na branch main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Deploy deve ser feito a partir da branch main"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Há mudanças não commitadas. Commit antes de fazer deploy."
    exit 1
fi

# Executar testes
echo "🧪 Executando testes..."
npm test

# Verificar lint
echo "🔍 Verificando código..."
npm run lint

# Build local para verificar
echo "🏗️ Fazendo build local..."
npm run build

# Gerar Prisma client
echo "📊 Gerando Prisma client..."
npx prisma generate

# Fazer push para Railway
echo "🚂 Fazendo deploy no Railway..."
railway up

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Aplicação disponível em: https://fsiioflow-3-production.up.railway.app"
