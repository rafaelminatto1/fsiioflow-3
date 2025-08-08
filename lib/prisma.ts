// lib/prisma.ts - Cliente Prisma otimizado com singleton pattern
import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Singleton pattern para evitar múltiplas conexões
export const prisma = globalThis.__prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'colored',
  });

// Hot reload em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;