# Dockerfile para produção otimizado
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependências
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production --omit=dev

# Rebuild do código fonte apenas quando necessário
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Imagem de produção, copiar todos os arquivos e executar
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copiar build da aplicação
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando de inicialização
CMD ["node", "server.js"]
