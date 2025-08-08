@echo off
REM scripts/setup.bat - Script de setup para Windows

echo 🚀 FISIOFLOW - Setup Automatico
echo ================================

REM 1. Instalar dependencias
echo 📦 Instalando dependencias...
call npm install

REM 2. Gerar Prisma Client
echo 🔧 Gerando Prisma Client...
call npx prisma generate

REM 3. Verificar .env
if not exist .env (
    echo ⚠️  Arquivo .env nao encontrado!
    echo 📝 Copiando .env.example para .env...
    copy .env.example .env
    echo ✅ Configure suas variaveis de ambiente em .env
) else (
    echo ✅ Arquivo .env encontrado
)

REM 4. Aplicar schema no banco
echo 🗄️  Aplicando schema no banco...
call npx prisma db push

REM 5. Testar conexao
echo 🧪 Testando conexao com banco...
call npx ts-node scripts/test-schema.ts
if errorlevel 1 (
    echo ❌ Erro na conexao com banco. Verifique suas configuracoes.
    pause
    exit /b 1
) else (
    echo ✅ Conexao com banco funcionando!
)

REM 6. Build do projeto
echo 🏗️  Fazendo build do projeto...
call npm run build

echo.
echo 🎉 SETUP COMPLETO!
echo ===================
echo.
echo 📋 Proximos passos:
echo 1. Configure suas variaveis em .env
echo 2. Execute: npm run dev
echo 3. Acesse: http://localhost:3000
echo.
echo 🔍 Health Check: http://localhost:3000/api/health
echo.
pause