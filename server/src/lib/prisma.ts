import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DATABASE_URL } = process.env;

let connectionUrl = DATABASE_URL;

// Prioritize DB_HOST + DB_USER + DB_NAME if set by Coolify environment
if (DB_HOST && DB_USER && DB_NAME) {
  const passwordPart = DB_PASSWORD ? `:${encodeURIComponent(DB_PASSWORD)}` : '';
  const portPart = DB_PORT || '3306';
  connectionUrl = `mysql://${DB_USER}${passwordPart}@${DB_HOST}:${portPart}/${DB_NAME}`;
}

if (connectionUrl) {
  console.log(`🔌 Conectando ao Banco de Dados MySQL: ${connectionUrl.replace(/:[^:@]+@/, ':****@')}`);
} else {
  console.warn('⚠️ Nenhuma URL de conexão MySQL encontrada. Verifique as variáveis no Coolify.');
}

export const prisma = new PrismaClient(
  connectionUrl
    ? {
        datasources: {
          db: {
            url: connectionUrl
          }
        }
      }
    : undefined
);
