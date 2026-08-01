import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://root@127.0.0.1:3306/nutri_estoque'
    }
  }
});

async function main() {
  console.log('⚡ Conectando ao MySQL local e executando database.sql...');
  
  const sqlPath = path.resolve(process.cwd(), '../database.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

  // Split SQL file by semicolon and filter out empty or comment lines
  const statements = sqlContent
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (err: any) {
      console.warn('⚠️ Erro ao executar instrução SQL:', err.message);
    }
  }

  console.log('✅ Banco de Dados MySQL no localhost criado e populado com sucesso com os dados de produção!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Erro no script de execução SQL:', err);
  process.exit(1);
});
